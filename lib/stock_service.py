import yfinance as yf
import pandas as pd
from datetime import datetime
import time
import hashlib
import json
import pprint
import os

class StockDataService:
    """주식 데이터 조회 공통 서비스"""
    
    def __init__(self, cache_enabled=True):
        self.cache_enabled = cache_enabled
        self.cache = {} if cache_enabled else None
        self.cache_timestamps = {} if cache_enabled else None
    
    def _generate_cache_key(self, stock_code, period, interval):
        """캐시 키 생성"""
        key_string = f"{stock_code}_{period}_{interval}"
        return hashlib.md5(key_string.encode()).hexdigest()
    
    def _get_from_cache(self, stock_code, period, interval, max_age_minutes=15):
        """캐시에서 데이터 조회"""
        if not self.cache_enabled:
            return None
            
        key = self._generate_cache_key(stock_code, period, interval)
        
        if key in self.cache and key in self.cache_timestamps:
            cache_time = self.cache_timestamps[key]
            current_time = time.time()
            age_minutes = (current_time - cache_time) / 60
            
            if age_minutes < max_age_minutes:
                print(f"Cache HIT for {stock_code} (age: {age_minutes:.1f} minutes)")
                return self.cache[key]
            else:
                print(f"Cache EXPIRED for {stock_code} (age: {age_minutes:.1f} minutes)")
                del self.cache[key]
                del self.cache_timestamps[key]
        
        print(f"Cache MISS for {stock_code}")
        return None
    
    def _set_cache(self, stock_code, period, interval, data):
        """캐시에 데이터 저장"""
        if not self.cache_enabled:
            return
            
        key = self._generate_cache_key(stock_code, period, interval)
        self.cache[key] = data
        self.cache_timestamps[key] = time.time()
        print(f"Cache SET for {stock_code}")
    
    def _clear_expired_cache(self, max_age_minutes=60):
        """만료된 캐시 정리"""
        if not self.cache_enabled:
            return
            
        current_time = time.time()
        expired_keys = []
        
        for key, timestamp in self.cache_timestamps.items():
            age_minutes = (current_time - timestamp) / 60
            if age_minutes > max_age_minutes:
                expired_keys.append(key)
        
        for key in expired_keys:
            del self.cache[key]
            del self.cache_timestamps[key]
        
        if expired_keys:
            print(f"Cleared {len(expired_keys)} expired cache entries")
    
    def _get_yahoo_symbol(self, stock_code):
        """종목코드를 Yahoo Finance 심볼로 변환"""
        if stock_code.isdigit() and len(stock_code) == 6:
            return f"{stock_code}.KS"
        return stock_code
    
    def _fetch_stock_info(self, ticker):
        """주식 정보 조회"""
        try:
            info = ticker.info
            symbol_name = info.get('longName') or info.get('shortName') or info.get('symbol', '알 수 없음')
            print(f"Symbol name: {symbol_name}")
            print(f"Market: {info.get('market', 'Unknown')}")
            print(f"Currency: {info.get('currency', 'Unknown')}")
            return symbol_name, info
        except Exception as e:
            print(f"Failed to get symbol info: {e}")
            return '알 수 없음', {}
    
    def _fetch_historical_data(self, ticker, period, interval, yahoo_symbol):
        """히스토리 데이터 조회 (재시도 로직 포함)"""
        hist = None
        max_retries = 2
        
        for attempt in range(max_retries):
            try:
                print(f"Attempt {attempt + 1}/{max_retries} to fetch data...")
                hist = ticker.history(period=period, interval=interval)
                
                if not hist.empty:
                    print(f"Successfully fetched {len(hist)} data points")
                    print(f"Date range: {hist.index[0]} to {hist.index[-1]}")
                    break
                else:
                    print(f"No data returned for {yahoo_symbol}")
                    
            except Exception as e:
                print(f"Attempt {attempt + 1} failed: {str(e)}")
                if attempt == max_retries - 1:
                    raise e
                time.sleep(0.5)
        
        # KOSDAQ 재시도
        if (hist is None or hist.empty) and yahoo_symbol.endswith('.KS'):
            kosdaq_symbol = yahoo_symbol.replace('.KS', '.KQ')
            print(f"Retrying with KOSDAQ symbol: {kosdaq_symbol}")
            
            try:
                ticker_kq = yf.Ticker(kosdaq_symbol)
                hist = ticker_kq.history(period=period, interval=interval)
                if not hist.empty:
                    yahoo_symbol = kosdaq_symbol
                    print(f"Successfully fetched KOSDAQ data: {len(hist)} points")
            except Exception as e:
                print(f"KOSDAQ retry failed: {str(e)}")
        
        return hist, yahoo_symbol
    
    def _convert_to_candle_data(self, hist):
        """히스토리 데이터를 캔들 데이터로 변환"""
        candle_data = []
        print("Converting data to candle format...")
        
        for date, row in hist.iterrows():
            try:
                # JavaScript의 date.getTime() / 1000과 동일한 Unix timestamp (초 단위)
                # date: ex. Timestamp('2025-07-11 09:00:00+0900', tz='Asia/Seoul')
                time_timestamp = int(date.timestamp())

                candle_data.append({
                    'time': time_timestamp,
                    'open': round(float(row['Open']), 2) if pd.notna(row['Open']) else 0,
                    'high': round(float(row['High']), 2) if pd.notna(row['High']) else 0,
                    'low': round(float(row['Low']), 2) if pd.notna(row['Low']) else 0,
                    'close': round(float(row['Close']), 2) if pd.notna(row['Close']) else 0,
                    'volume': int(row['Volume']) if pd.notna(row['Volume']) else 0,
                    'adj_close': round(float(row.get('Adj Close', row['Close'])), 2) if pd.notna(row.get('Adj Close', row['Close'])) else 0
                })
            except Exception as e:
                print(f"Error processing row for {date}: {e}")
                continue
        
        print(f"Successfully converted {len(candle_data)} data points")
        return candle_data
    
    def get_stock_data(self, stock_code, period='3mo', interval='1d', force_refresh=False, server_name='Stock Service'):
        """주식 데이터 조회 메인 메서드"""
        try:
            # 캐시에서 데이터 조회
            if not force_refresh:
                cached_data = self._get_from_cache(stock_code, period, interval)
                if cached_data:
                    cached_data['data']['cache_info']['from_cache'] = True
                    return cached_data
            
            # Yahoo Finance 심볼 생성
            yahoo_symbol = self._get_yahoo_symbol(stock_code)
            print(f"Fetching data for {yahoo_symbol} (period: {period}, interval: {interval})")
            
            # Ticker 생성
            ticker = yf.Ticker(yahoo_symbol)
            
            # 주식 정보 조회
            symbol_name, info = self._fetch_stock_info(ticker)
            
            # 개발 환경에서만 pprint 실행
            if os.getenv('ENV') == 'development':
                pprint.pprint(info)
            
            # 히스토리 데이터 조회
            hist, final_yahoo_symbol = self._fetch_historical_data(ticker, period, interval, yahoo_symbol)
            
            if hist is None or hist.empty:
                raise Exception(f"종목코드 {stock_code}에 대한 데이터를 찾을 수 없습니다. KOSPI(.KS)와 KOSDAQ(.KQ) 모두 시도했습니다.")
            
            # 캔들 데이터 변환
            candle_data = self._convert_to_candle_data(hist)

            # 응답 데이터 구성
            response_data = {
                'success': True,
                'data': {
                    'symbol': final_yahoo_symbol,
                    'stock_code': stock_code,
                    'symbol_name': symbol_name,
                    'display_name': info.get('shortName') or symbol_name,
                    'period': period,
                    'interval': interval,
                    'candles': candle_data,
                    'total_count': len(candle_data),
                    'server': server_name,
                    'yfinance_version': '0.2.64',
                    'timestamp': datetime.now().isoformat(),
                    'market_info': {
                        'currency': info.get('currency', 'KRW') if info else 'KRW',
                        'market': info.get('market', 'KRX') if info else 'KRX',
                        'timezone': info.get('timeZoneFullName', 'Asia/Seoul') if info else 'Asia/Seoul'
                    },
                    'cache_info': {
                        'from_cache': False,
                        'note': 'Vercel runtime does not support persistent caching' if server_name == 'Vercel Python Runtime' else 'Local cache available'
                    }
                }
            }
            
            # 캐시에 저장
            self._set_cache(stock_code, period, interval, response_data)
            
            # 만료된 캐시 정리
            self._clear_expired_cache()
            
            return response_data
            
        except Exception as e:
            error_message = f"데이터 조회 중 오류가 발생했습니다: {str(e)}"
            print(f"Error: {error_message}")
            raise Exception(error_message)
    
    def get_cache_stats(self):
        """캐시 통계 조회"""
        if not self.cache_enabled:
            return {'cache_enabled': False}
        
        current_time = time.time()
        cache_info = []
        
        for key in self.cache.keys():
            age_minutes = (current_time - self.cache_timestamps[key]) / 60
            cache_info.append({
                'key': key,
                'age_minutes': round(age_minutes, 1)
            })
        
        return {
            'cache_enabled': True,
            'total_entries': len(self.cache),
            'entries': cache_info
        }
    
    def clear_cache(self):
        """전체 캐시 삭제"""
        if self.cache_enabled:
            self.cache.clear()
            self.cache_timestamps.clear()
            print("Cache cleared")
    
    def clear_expired_cache(self):
        """만료된 캐시만 삭제"""
        self._clear_expired_cache() 
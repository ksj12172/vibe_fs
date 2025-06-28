from flask import Flask, request, jsonify
from flask_cors import CORS
import yfinance as yf
import pandas as pd
from datetime import datetime, timedelta
import pytz
import os
import hashlib
import json
import time

app = Flask(__name__)
CORS(app)  # CORS 설정

# 간단한 메모리 캐시 클래스
class SimpleCache:
    def __init__(self):
        self.cache = {}
        self.timestamps = {}
    
    def _generate_key(self, stock_code, period, interval):
        """캐시 키 생성"""
        key_string = f"{stock_code}_{period}_{interval}"
        return hashlib.md5(key_string.encode()).hexdigest()
    
    def get(self, stock_code, period, interval, max_age_minutes=15):
        """캐시에서 데이터 조회 (기본 15분 캐시)"""
        key = self._generate_key(stock_code, period, interval)
        
        if key in self.cache and key in self.timestamps:
            # 캐시 만료 시간 확인
            cache_time = self.timestamps[key]
            current_time = time.time()
            age_minutes = (current_time - cache_time) / 60
            
            if age_minutes < max_age_minutes:
                print(f"Cache HIT for {stock_code} (age: {age_minutes:.1f} minutes)")
                return self.cache[key]
            else:
                print(f"Cache EXPIRED for {stock_code} (age: {age_minutes:.1f} minutes)")
                # 만료된 캐시 삭제
                del self.cache[key]
                del self.timestamps[key]
        
        print(f"Cache MISS for {stock_code}")
        return None
    
    def set(self, stock_code, period, interval, data):
        """캐시에 데이터 저장"""
        key = self._generate_key(stock_code, period, interval)
        self.cache[key] = data
        self.timestamps[key] = time.time()
        print(f"Cache SET for {stock_code}")
    
    def clear_expired(self, max_age_minutes=60):
        """만료된 캐시 정리 (기본 1시간)"""
        current_time = time.time()
        expired_keys = []
        
        for key, timestamp in self.timestamps.items():
            age_minutes = (current_time - timestamp) / 60
            if age_minutes > max_age_minutes:
                expired_keys.append(key)
        
        for key in expired_keys:
            del self.cache[key]
            del self.timestamps[key]
        
        if expired_keys:
            print(f"Cleared {len(expired_keys)} expired cache entries")
    
    def get_stats(self):
        """캐시 통계 조회"""
        current_time = time.time()
        cache_info = []
        
        for key in self.cache.keys():
            age_minutes = (current_time - self.timestamps[key]) / 60
            cache_info.append({
                'key': key,
                'age_minutes': round(age_minutes, 1)
            })
        
        return {
            'total_entries': len(self.cache),
            'entries': cache_info
        }

# 전역 캐시 인스턴스
stock_cache = SimpleCache()

@app.route('/api/stock-data/<stock_code>')
def get_stock_data(stock_code):
    try:
        # 쿼리 파라미터 가져오기, 딕셔너리의 get() 메서드, 디폴트 값은 3mo, 1d
        period = request.args.get('period', '3mo')
        interval = request.args.get('interval', '1d')
        force_refresh = request.args.get('force_refresh', 'false').lower() == 'true'
        
        # 캐시에서 데이터 조회 (force_refresh가 true가 아닌 경우)
        if not force_refresh:
            cached_data = stock_cache.get(stock_code, period, interval)
            if cached_data:
                # 캐시된 데이터에 캐시 정보 추가
                cached_data['data']['cache_info'] = {
                    'from_cache': True,
                    'timestamp': cached_data['data']['timestamp']
                }
                return jsonify(cached_data)
        
        # 한국 주식의 경우 .KS 또는 .KQ 접미사 추가
        if stock_code.isdigit() and len(stock_code) == 6:
            # 카카오(035720), 삼성전자(005930) 등 코스피 주식은 .KS
            # 코스닥 주식은 .KQ (일단 .KS로 시작)
            yahoo_symbol = f"{stock_code}.KS"
        else:
            yahoo_symbol = stock_code
        
        print(f"Fetching data for {yahoo_symbol} (period: {period}, interval: {interval})")
        
        # yfinance로 데이터 가져오기 (0.2.64 최신 버전)
        print(f"Creating ticker for {yahoo_symbol}")
        
        # 최신 yfinance는 자동으로 적절한 헤더와 세션을 관리합니다
        ticker = yf.Ticker(yahoo_symbol)
        
        # 주식 정보 가져오기 (안정적인 방법)
        try:
            # 기본 info 속성 사용 (가장 안정적)
            info = ticker.info
            company_name = info.get('longName') or info.get('shortName') or info.get('symbol', '알 수 없음')
            print(f"Company name: {company_name}")
            print(f"Market: {info.get('market', 'Unknown')}")
            print(f"Currency: {info.get('currency', 'Unknown')}")
        except Exception as e:
            print(f"Failed to get company info: {e}")
            company_name = '알 수 없음'
            info = {}
        
        # 히스토리 데이터 가져오기 (0.2.64 개선된 방법)
        hist = None
        max_retries = 2
        
        for attempt in range(max_retries):
            try:
                print(f"Attempt {attempt + 1}/{max_retries} to fetch data...")
                
                # yfinance 히스토리 데이터 조회 (호환성 우선)
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
                
                # 잠시 대기 후 재시도
                import time
                time.sleep(0.5)
        
        if hist is None or hist.empty:
            # .KQ (코스닥)으로 재시도
            if yahoo_symbol.endswith('.KS'):
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
                    pass
            
            if hist is None or hist.empty:
                return jsonify({
                    'success': False,
                    'error': {
                        'code': 404,
                        'message': f"종목코드 {stock_code}에 대한 데이터를 찾을 수 없습니다. KOSPI(.KS)와 KOSDAQ(.KQ) 모두 시도했습니다."
                    }
                }), 404
        
        # 데이터 변환 (0.2.64 최적화)
        candle_data = []
        print("Converting data to candle format...")
        
        for date, row in hist.iterrows():
            # 최신 yfinance는 더 정확한 데이터 타입을 제공합니다
            try:
                candle_data.append({
                    'time': date.strftime('%Y-%m-%d'),
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
        
        # 응답 데이터 구성 (캐싱 포함)
        response_data = {
            'success': True,
            'data': {
                'symbol': yahoo_symbol,
                'stock_code': stock_code,
                'company_name': company_name,
                'period': period,
                'interval': interval,
                'candles': candle_data,
                'total_count': len(candle_data),
                'server': 'Python Flask (Local Development)',
                'yfinance_version': '0.2.64',
                'timestamp': datetime.now().isoformat(),
                'market_info': {
                    'currency': info.get('currency', 'KRW') if 'info' in locals() else 'KRW',
                    'market': info.get('market', 'KRX') if 'info' in locals() else 'KRX',
                    'timezone': info.get('timeZoneFullName', 'Asia/Seoul') if 'info' in locals() else 'Asia/Seoul'
                },
                'cache_info': {
                    'from_cache': False,
                    'cached_at': datetime.now().isoformat()
                }
            }
        }
        
        # 데이터를 캐시에 저장
        stock_cache.set(stock_code, period, interval, response_data)
        
        # 만료된 캐시 정리 (요청이 올 때마다 정리)
        stock_cache.clear_expired()
        
        return jsonify(response_data)
        
    except Exception as e:
        error_message = f"데이터 조회 중 오류가 발생했습니다: {str(e)}"
        print(f"Error: {error_message}")
        return jsonify({
            'success': False,
            'error': {
                'code': 500,
                'message': error_message
            }
        }), 500

@app.route('/health')
def health_check():
    cache_stats = stock_cache.get_stats()
    return jsonify({
        'status': 'healthy',
        'server': 'Python Flask Stock API',
        'timestamp': datetime.now().isoformat(),
        'cache_stats': cache_stats
    })

@app.route('/cache/stats')
def cache_stats():
    """캐시 통계 조회"""
    stats = stock_cache.get_stats()
    return jsonify({
        'success': True,
        'cache_stats': stats,
        'timestamp': datetime.now().isoformat()
    })

@app.route('/cache/clear', methods=['POST'])
def clear_cache():
    """캐시 전체 삭제"""
    cleared_count = len(stock_cache.cache)
    stock_cache.cache.clear()
    stock_cache.timestamps.clear()
    
    return jsonify({
        'success': True,
        'message': f'Cleared {cleared_count} cache entries',
        'timestamp': datetime.now().isoformat()
    })

@app.route('/cache/clear-expired', methods=['POST'])
def clear_expired_cache():
    """만료된 캐시만 삭제"""
    before_count = len(stock_cache.cache)
    stock_cache.clear_expired()
    after_count = len(stock_cache.cache)
    cleared_count = before_count - after_count
    
    return jsonify({
        'success': True,
        'message': f'Cleared {cleared_count} expired cache entries',
        'remaining_entries': after_count,
        'timestamp': datetime.now().isoformat()
    })

if __name__ == '__main__':
    # 환경변수에서 포트 읽기, 기본값은 5001
    port = int(os.getenv('PYTHON_API_PORT', 5001))
    
    print("Starting Python Stock API Server...")
    print("Available endpoints:")
    print("  - GET /api/stock-data/<stock_code>?period=3mo&interval=1d&force_refresh=false")
    print("  - GET /health")
    print("  - GET /cache/stats")
    print("  - POST /cache/clear")
    print("  - POST /cache/clear-expired")
    print(f"  - Server will run on http://localhost:{port}")
    print(f"  - Port from environment: PYTHON_API_PORT={os.getenv('PYTHON_API_PORT', 'not set, using default 5001')}")
    print("")
    print("📦 Cache Configuration:")
    print("  - Default cache TTL: 15 minutes")
    print("  - Auto cleanup: 60 minutes")
    print("  - Force refresh: add ?force_refresh=true")
    
    app.run(debug=True, host='0.0.0.0', port=port) 
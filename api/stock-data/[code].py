from http.server import BaseHTTPRequestHandler
import json
import yfinance as yf
import pandas as pd
from datetime import datetime, timedelta
import pytz
import os
import urllib.parse

# Vercel Python Runtime은 app/api/**/*.py 경로에 있는 .py 파일을 Python Serverless Function으로 자동으로 빌드합니다.

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        try:
            # URL에서 종목코드 추출
            path_parts = self.path.split('/')
            stock_code = None
            
            for i, part in enumerate(path_parts):
                if part == 'stock-data' and i + 1 < len(path_parts):
                    # 쿼리 파라미터 분리
                    code_with_params = path_parts[i + 1]
                    stock_code = code_with_params.split('?')[0]
                    break
            
            if not stock_code:
                self.send_error_response(400, "종목코드가 필요합니다")
                return
            
            # 쿼리 파라미터 파싱
            query_params = self.parse_query_params()
            period = query_params.get('period', '3mo')
            interval = query_params.get('interval', '1d')
            
            print(f"Vercel: Fetching data for {stock_code} (period: {period}, interval: {interval})")
            
            # 한국 주식의 경우 .KS 또는 .KQ 접미사 추가
            if stock_code.isdigit() and len(stock_code) == 6:
                yahoo_symbol = f"{stock_code}.KS"
            else:
                yahoo_symbol = stock_code
            
            print(f"Creating ticker for {yahoo_symbol}")
            
            # yfinance로 데이터 가져오기
            ticker = yf.Ticker(yahoo_symbol)
            
            # 주식 정보 가져오기
            try:
                info = ticker.info
                company_name = info.get('longName') or info.get('shortName') or info.get('symbol', '알 수 없음')
                print(f"Company name: {company_name}")
                print(f"Market: {info.get('market', 'Unknown')}")
                print(f"Currency: {info.get('currency', 'Unknown')}")
            except Exception as e:
                print(f"Failed to get company info: {e}")
                company_name = '알 수 없음'
                info = {}
            
            # 히스토리 데이터 가져오기 (재시도 로직 포함)
            hist = None
            max_retries = 2
            
            for attempt in range(max_retries):
                try:
                    print(f"Attempt {attempt + 1}/{max_retries} to fetch data...")
                    
                    # yfinance 히스토리 데이터 조회
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
                    self.send_error_response(404, f"종목코드 {stock_code}에 대한 데이터를 찾을 수 없습니다. KOSPI(.KS)와 KOSDAQ(.KQ) 모두 시도했습니다.")
                    return
            
            # 데이터 변환
            candle_data = []
            print("Converting data to candle format...")
            
            for date, row in hist.iterrows():
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
            
            # 응답 데이터 구성
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
                    'server': 'Vercel Python Runtime',
                    'yfinance_version': '0.2.64',
                    'timestamp': datetime.now().isoformat(),
                    'market_info': {
                        'currency': info.get('currency', 'KRW') if info else 'KRW',
                        'market': info.get('market', 'KRX') if info else 'KRX',
                        'timezone': info.get('timeZoneFullName', 'Asia/Seoul') if info else 'Asia/Seoul'
                    },
                    'cache_info': {
                        'from_cache': False,
                        'note': 'Vercel runtime does not support persistent caching'
                    }
                }
            }
            
            self.send_json_response(200, response_data)
            
        except Exception as e:
            error_message = f"데이터 조회 중 오류가 발생했습니다: {str(e)}"
            print(f"Error: {error_message}")
            self.send_error_response(500, error_message)
    
    def parse_query_params(self):
        """URL 쿼리 파라미터 파싱"""
        query_params = {}
        if '?' in self.path:
            query_string = self.path.split('?')[1]
            # URL 인코딩된 문자열을 디코딩(unquote)하는 코드
            # URL 인코딩: 웹 주소(URL)나 쿼리 스트링(query string)에는 특수 문자(예: 공백, /, &, ? 등)가 그대로 사용될 수 없기 때문에 **퍼센트 인코딩(percent-encoding)**이라는 방식으로 변환됩니다. 
            # 예를 들어, 공백은 %20으로, 한글은 %ED%95%9C%EA%B8%80과 같이 인코딩된다.
            # 디코딩은 원래 문자열로 돌려주는 것
            query_string = urllib.parse.unquote(query_string)
            
            for param in query_string.split('&'):
                if '=' in param:
                    key, value = param.split('=', 1)
                    query_params[key] = value
        return query_params
    
    def send_json_response(self, status_code, data):
        """JSON 응답 전송"""
        self.send_response(status_code)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
        
        json_data = json.dumps(data, ensure_ascii=False, indent=2)
        self.wfile.write(json_data.encode('utf-8'))
    
    def send_error_response(self, status_code, message):
        """에러 응답 전송"""
        error_data = {
            'success': False,
            'error': {
                'code': status_code,
                'message': message
            },
            'server': 'Vercel Python Runtime',
            'timestamp': datetime.now().isoformat()
        }
        self.send_json_response(status_code, error_data)
    
    def do_OPTIONS(self):
        """CORS preflight 요청 처리"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers() 
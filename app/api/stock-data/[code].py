from http.server import BaseHTTPRequestHandler
import json
import yfinance as yf
import pandas as pd
from datetime import datetime, timedelta
import pytz

# Vercel Python Runtime은 app/api/**/*.py 경로에 있는 .py 파일을 Python Serverless Function으로 자동으로 빌드합니다.

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        try:
            # URL에서 종목코드 추출
            path_parts = self.path.split('/')
            stock_code = None
            
            for i, part in enumerate(path_parts):
                if part == 'stock-data' and i + 1 < len(path_parts):
                    stock_code = path_parts[i + 1].split('?')[0]  # 쿼리 파라미터 제거
                    break
            
            if not stock_code:
                self.send_error_response(400, "종목코드가 필요합니다")
                return
            
            # 한국 주식의 경우 .KS 또는 .KQ 접미사 추가
            if stock_code.isdigit() and len(stock_code) == 6:
                # 카카오(035720), 삼성전자(005930) 등 코스피 주식은 .KS
                # 코스닥 주식은 .KQ (일단 .KS로 시작)
                yahoo_symbol = f"{stock_code}.KS"
            else:
                yahoo_symbol = stock_code
            
            # 쿼리 파라미터 파싱
            query_params = self.parse_query_params()
            period = query_params.get('period', '3mo')  # 기본 3개월
            interval = query_params.get('interval', '1d')  # 기본 1일
            
            # yfinance로 데이터 가져오기
            ticker = yf.Ticker(yahoo_symbol)
            
            # 주식 정보 가져오기
            try:
                info = ticker.info
                company_name = info.get('longName', info.get('shortName', '알 수 없음'))
            except:
                company_name = '알 수 없음'
            
            # 히스토리 데이터 가져오기
            hist = ticker.history(period=period, interval=interval)
            
            if hist.empty:
                self.send_error_response(404, f"종목코드 {stock_code}에 대한 데이터를 찾을 수 없습니다")
                return
            
            # 데이터 변환
            candle_data = []
            for date, row in hist.iterrows():
                candle_data.append({
                    'time': date.strftime('%Y-%m-%d'),
                    'open': round(float(row['Open']), 2),
                    'high': round(float(row['High']), 2),
                    'low': round(float(row['Low']), 2),
                    'close': round(float(row['Close']), 2),
                    'volume': int(row['Volume']) if pd.notna(row['Volume']) else 0
                })
            
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
                    'total_count': len(candle_data)
                }
            }
            
            self.send_json_response(200, response_data)
            
        except Exception as e:
            error_message = f"데이터 조회 중 오류가 발생했습니다: {str(e)}"
            self.send_error_response(500, error_message)
    
    def parse_query_params(self):
        """URL 쿼리 파라미터 파싱"""
        query_params = {}
        if '?' in self.path:
            query_string = self.path.split('?')[1]
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
            }
        }
        self.send_json_response(status_code, error_data)
    
    def do_OPTIONS(self):
        """CORS preflight 요청 처리"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers() 
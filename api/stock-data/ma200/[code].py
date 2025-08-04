from http.server import BaseHTTPRequestHandler
import json
from datetime import datetime
import urllib.parse
import sys
import os

# 공통 모듈 import를 위한 경로 추가
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..', '..', 'lib'))
from stock_service import StockDataService

# Vercel Python Runtime은 app/api/**/*.py 경로에 있는 .py 파일을 Python Serverless Function으로 자동으로 빌드합니다.

# StockDataService 인스턴스 생성 (Vercel에서는 캐시 비활성화)
stock_service = StockDataService(cache_enabled=False)

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        try:
            # URL에서 종목코드 추출
            path_parts = self.path.split('/')
            stock_code = None
            
            # /api/stock-data/ma200/<stock_code> 형식에서 종목코드 추출
            for i, part in enumerate(path_parts):
                if part == 'ma200' and i + 1 < len(path_parts):
                    # 쿼리 파라미터 분리
                    code_with_params = path_parts[i + 1]
                    stock_code = code_with_params.split('?')[0]
                    break
            
            if not stock_code:
                self.send_error_response(400, "종목코드가 필요합니다")
                return
            
            # 쿼리 파라미터 파싱
            query_params = self.parse_query_params()
            force_refresh = query_params.get('force_refresh', 'false').lower() == 'true'
            
            # 개선된 MA200 메서드 사용
            response_data = stock_service.get_ma200_data(
                stock_code=stock_code,
                force_refresh=force_refresh,
                server_name='Vercel Python Runtime'
            )
            
            self.send_json_response(200, response_data)
            
        except Exception as e:
            error_message = f"200일 이동평균 계산 중 오류가 발생했습니다: {str(e)}"
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
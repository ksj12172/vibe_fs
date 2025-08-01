from http.server import BaseHTTPRequestHandler
import json
from datetime import datetime
import urllib.parse
import sys
import os
import pandas as pd

# 공통 모듈 import를 위한 경로 추가
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..', 'lib'))
from fred_service import FredService

# FredService 인스턴스 생성
fred_service = FredService()

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        try:
            # URL에서 series_id 추출
            path_parts = self.path.split('/')
            series_id = None
            
            for i, part in enumerate(path_parts):
                if part == 'fred-data' and i + 1 < len(path_parts):
                    # 쿼리 파라미터 분리
                    id_with_params = path_parts[i + 1]
                    series_id = id_with_params.split('?')[0]
                    break
            
            if not series_id:
                self.send_error_response(400, "Series ID가 필요합니다")
                return
            
            # 쿼리 파라미터 파싱
            query_params = self.parse_query_params()
            start_date = query_params.get('start_date', None)
            end_date = query_params.get('end_date', None)
            
            # Fred 서비스를 사용하여 데이터 조회
            fred_data = fred_service.get_series(series_id)
            
            if fred_data is None or fred_data.empty:
                self.send_error_response(404, f"Series ID {series_id}에 대한 데이터를 찾을 수 없습니다")
                return
            
            # 날짜 필터링
            if start_date:
                fred_data = fred_data[fred_data.index >= start_date]
            if end_date:
                fred_data = fred_data[fred_data.index <= end_date]
            
            # 데이터를 차트 형태로 변환
            chart_data = []
            for date, value in fred_data.items():
                if not pd.isna(value):
                    chart_data.append({
                        'time': int(date.timestamp()),
                        'value': float(value)
                    })
            
            response_data = {
                'success': True,
                'data': {
                    'series_id': series_id,
                    'title': f'FRED Series: {series_id}',
                    'data': chart_data,
                    'total_count': len(chart_data),
                    'server': 'Vercel Python Runtime',
                    'timestamp': datetime.now().isoformat(),
                    'start_date': start_date,
                    'end_date': end_date
                }
            }
            
            self.send_json_response(200, response_data)
            
        except Exception as e:
            self.send_error_response(500, f"데이터 조회 중 오류가 발생했습니다: {str(e)}")

    def parse_query_params(self):
        """쿼리 파라미터 파싱"""
        if '?' not in self.path:
            return {}
        
        query_string = self.path.split('?', 1)[1]
        return dict(urllib.parse.parse_qsl(query_string))

    def send_json_response(self, status_code, data):
        """JSON 응답 전송"""
        self.send_response(status_code)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
        
        response_json = json.dumps(data, ensure_ascii=False, indent=2)
        self.wfile.write(response_json.encode('utf-8'))

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
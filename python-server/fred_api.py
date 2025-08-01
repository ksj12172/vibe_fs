from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime
import sys
import os
import pandas as pd

# 공통 모듈 import를 위한 경로 추가
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'lib'))
from fred_service import FredService

app = Flask(__name__)
CORS(app)  # CORS 설정

# FredService 인스턴스 생성
fred_service = FredService()

@app.route('/api/fred-data/<series_id>')
def get_fred_data(series_id):
    try:
        # 쿼리 파라미터 가져오기
        start_date = request.args.get('start_date', None)
        end_date = request.args.get('end_date', None)
        
        # Fred 서비스를 사용하여 데이터 조회
        fred_data = fred_service.get_series(series_id)
        
        if fred_data is None or fred_data.empty:
            return jsonify({
                'success': False,
                'error': {
                    'code': 404,
                    'message': f"Series ID {series_id}에 대한 데이터를 찾을 수 없습니다"
                },
                'server': 'Python Flask (Local Development)',
                'timestamp': datetime.now().isoformat()
            }), 404
        
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
                'server': 'Python Flask (Local Development)',
                'timestamp': datetime.now().isoformat(),
                'start_date': start_date,
                'end_date': end_date
            }
        }
        
        return jsonify(response_data)
        
    except Exception as e:
        error_message = f"데이터 조회 중 오류가 발생했습니다: {str(e)}"
        print(f"Error: {error_message}")
        return jsonify({
            'success': False,
            'error': {
                'code': 500,
                'message': error_message
            },
            'server': 'Python Flask (Local Development)',
            'timestamp': datetime.now().isoformat()
        }), 500

@app.route('/health')
def health_check():
    """헬스 체크 엔드포인트"""
    return jsonify({
        'status': 'ok',
        'message': 'Fred API Server is running',
        'timestamp': datetime.now().isoformat()
    })

if __name__ == '__main__':
    print("Starting Fred API Server...")
    print("API endpoints:")
    print("  - GET /api/fred-data/<series_id>")
    print("  - GET /health")
    app.run(debug=True, host='0.0.0.0', port=5001) 
from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime
import sys
import os
import pandas as pd

# 공통 모듈 import를 위한 경로 추가
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'lib'))
from stock_service import StockDataService
from fred_service import FredService

app = Flask(__name__)
CORS(app)  # CORS 설정

# 서비스 인스턴스 생성
stock_service = StockDataService(cache_enabled=True)
fred_service = FredService()

# ===== Stock API Endpoints =====

@app.route('/api/stock-data/<stock_code>')
def get_stock_data(stock_code):
    try:
        # 쿼리 파라미터 가져오기
        period = request.args.get('period', '3mo')
        interval = request.args.get('interval', '1d')
        force_refresh = request.args.get('force_refresh', 'false').lower() == 'true'
        
        # 공통 서비스를 사용하여 데이터 조회
        response_data = stock_service.get_stock_data(
            stock_code=stock_code,
            period=period,
            interval=interval,
            force_refresh=force_refresh,
            server_name='Python Flask (Local Development)'
        )
        
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

@app.route('/api/ma200/<stock_code>')
def get_ma200_data(stock_code):
    try:
        # 쿼리 파라미터 가져오기
        force_refresh = request.args.get('force_refresh', 'false').lower() == 'true'
        
        # 개선된 MA200 메서드 사용
        response_data = stock_service.get_ma200_data(
            stock_code=stock_code,
            force_refresh=force_refresh,
            server_name='Python Flask (Local Development)'
        )
        
        return jsonify(response_data)
        
    except Exception as e:
        error_message = f"200일 이동평균 계산 중 오류가 발생했습니다: {str(e)}"
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

@app.route('/cache/stats')
def cache_stats():
    """캐시 통계 조회"""
    stats = stock_service.get_cache_stats()
    return jsonify({
        'success': True,
        'cache_stats': stats,
        'server': 'Python Flask (Local Development)',
        'timestamp': datetime.now().isoformat()
    })

@app.route('/cache/clear', methods=['POST'])
def clear_cache():
    """전체 캐시 삭제"""
    stock_service.clear_cache()
    return jsonify({
        'success': True,
        'message': 'Cache cleared successfully',
        'server': 'Python Flask (Local Development)',
        'timestamp': datetime.now().isoformat()
    })

@app.route('/cache/clear-expired', methods=['POST'])
def clear_expired_cache():
    """만료된 캐시만 삭제"""
    stock_service.clear_expired_cache()
    return jsonify({
        'success': True,
        'message': 'Expired cache cleared successfully',
        'server': 'Python Flask (Local Development)',
        'timestamp': datetime.now().isoformat()
    })

# ===== FRED API Endpoints =====

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

# ===== Health Check Endpoints =====

@app.route('/health')
def health_check():
    """헬스 체크 엔드포인트"""
    return jsonify({
        'status': 'healthy',
        'services': {
            'stock_api': 'running',
            'fred_api': 'running'
        },
        'server': 'Python Flask (Local Development)',
        'timestamp': datetime.now().isoformat(),
        'cache_enabled': stock_service.cache_enabled
    })

@app.route('/api/status')
def api_status():
    """API 상태 정보"""
    return jsonify({
        'status': 'running',
        'apis': {
            'stock': {
                'endpoint': '/api/stock-data/<stock_code>',
                'cache_enabled': stock_service.cache_enabled,
                'cache_stats': stock_service.get_cache_stats()
            },
            'fred': {
                'endpoint': '/api/fred-data/<series_id>',
                'available': True
            }
        },
        'server': 'Python Flask (Local Development)',
        'timestamp': datetime.now().isoformat()
    })

if __name__ == '__main__':
    print("🚀 Starting Unified Python API Server...")
    print("📊 Available Stock API endpoints:")
    print("   - GET /api/stock-data/<stock_code>?period=3mo&interval=1d")
    print("   - GET /cache/stats")
    print("   - POST /cache/clear")
    print("   - POST /cache/clear-expired")
    print("📈 Available FRED API endpoints:")
    print("   - GET /api/fred-data/<series_id>?start_date=&end_date=")
    print("🔧 System endpoints:")
    print("   - GET /health")
    print("   - GET /api/status")
    print("")
    print(f"✅ Stock Service cache enabled: {stock_service.cache_enabled}")
    print(f"✅ FRED Service initialized")
    print("")
    app.run(debug=True, host='0.0.0.0', port=5001) 
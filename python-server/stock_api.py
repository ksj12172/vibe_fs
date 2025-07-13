from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime
import sys
import os

# 공통 모듈 import를 위한 경로 추가
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'lib'))
from stock_service import StockDataService

app = Flask(__name__)
CORS(app)  # CORS 설정

# StockDataService 인스턴스 생성 (캐시 활성화)
stock_service = StockDataService(cache_enabled=True)

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

@app.route('/health')
def health_check():
    """헬스 체크 엔드포인트"""
    return jsonify({
        'status': 'healthy',
        'server': 'Python Flask (Local Development)',
        'timestamp': datetime.now().isoformat(),
        'cache_enabled': stock_service.cache_enabled
    })

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

if __name__ == '__main__':
    print("Starting Flask server with StockDataService...")
    print(f"Cache enabled: {stock_service.cache_enabled}")
    app.run(debug=True, host='0.0.0.0', port=5001) 
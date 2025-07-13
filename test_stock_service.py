#!/usr/bin/env python3
"""
StockDataService 테스트 스크립트
"""

import sys
import os

# lib 디렉토리를 Python 경로에 추가
sys.path.append(os.path.join(os.path.dirname(__file__), 'lib'))

from stock_service import StockDataService

def test_stock_service():
    """StockDataService 테스트"""
    print("=== StockDataService 테스트 시작 ===")
    
    # 캐시 활성화된 서비스 생성
    service = StockDataService(cache_enabled=True)
    
    # 테스트할 종목코드
    test_codes = ['005930', '035720']  # 삼성전자, 카카오
    
    for stock_code in test_codes:
        print(f"\n--- {stock_code} 테스트 ---")
        
        try:
            # 첫 번째 요청 (캐시 미스)
            print("1. 첫 번째 요청 (캐시 미스 예상)")
            result1 = service.get_stock_data(
                stock_code=stock_code,
                period='1mo',
                interval='1d',
                server_name='Test Service'
            )
            
            if result1['success']:
                print(f"✅ 성공: {result1['data']['company_name']}")
                print(f"   데이터 포인트: {result1['data']['total_count']}")
                print(f"   캐시 여부: {result1['data']['cache_info']['from_cache']}")
            else:
                print(f"❌ 실패: {result1.get('error', {}).get('message', 'Unknown error')}")
            
            # 두 번째 요청 (캐시 히트)
            print("\n2. 두 번째 요청 (캐시 히트 예상)")
            result2 = service.get_stock_data(
                stock_code=stock_code,
                period='1mo',
                interval='1d',
                server_name='Test Service'
            )
            
            if result2['success']:
                print(f"✅ 성공: {result2['data']['company_name']}")
                print(f"   데이터 포인트: {result2['data']['total_count']}")
                print(f"   캐시 여부: {result2['data']['cache_info']['from_cache']}")
            else:
                print(f"❌ 실패: {result2.get('error', {}).get('message', 'Unknown error')}")
                
        except Exception as e:
            print(f"❌ 예외 발생: {str(e)}")
    
    # 캐시 통계 출력
    print(f"\n--- 캐시 통계 ---")
    stats = service.get_cache_stats()
    print(f"캐시 활성화: {stats['cache_enabled']}")
    if stats['cache_enabled']:
        print(f"캐시 엔트리 수: {stats['total_entries']}")
        for entry in stats['entries']:
            print(f"  - {entry['key']}: {entry['age_minutes']}분 전")
    
    print("\n=== 테스트 완료 ===")

if __name__ == '__main__':
    test_stock_service() 
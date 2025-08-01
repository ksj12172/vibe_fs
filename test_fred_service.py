import os
import sys
from datetime import datetime

# 공통 모듈 import를 위한 경로 추가
sys.path.append(os.path.join(os.path.dirname(__file__), 'lib'))

def test_fred_service():
    """Fred 서비스 테스트"""
    print("🧪 Fred Service 테스트 시작...")
    print("=" * 50)
    
    try:
        from fred_service import FredService
        
        # 환경변수 확인
        api_key = os.getenv('FRED_API_KEY')
        if not api_key:
            print("❌ FRED_API_KEY 환경변수가 설정되지 않았습니다.")
            print("다음 명령어로 환경변수를 설정하세요:")
            print("export FRED_API_KEY='your_fred_api_key_here'")
            return False
        
        print(f"✅ FRED_API_KEY 환경변수 확인됨: {api_key[:10]}...")
        
        # FredService 인스턴스 생성
        fred_service = FredService()
        print("✅ FredService 인스턴스 생성 완료")
        
        # M2SL 데이터 조회 테스트
        print("\n📊 M2SL (M2 Money Supply) 데이터 조회 중...")
        m2_data = fred_service.get_series('M2SL')
        
        if m2_data is not None and not m2_data.empty:
            print(f"✅ M2SL 데이터 조회 성공!")
            print(f"   - 데이터 포인트 수: {len(m2_data)}")
            print(f"   - 최신 데이터: {m2_data.index[-1]} = {m2_data.iloc[-1]}")
            print(f"   - 데이터 범위: {m2_data.index[0]} ~ {m2_data.index[-1]}")
        else:
            print("❌ M2SL 데이터 조회 실패")
            return False
            
        print("\n🎉 모든 테스트 통과!")
        return True
        
    except ImportError as e:
        print(f"❌ 모듈 import 실패: {e}")
        print("fredapi를 설치하세요: pip install fredapi")
        return False
    except Exception as e:
        print(f"❌ 테스트 실패: {e}")
        return False

if __name__ == "__main__":
    success = test_fred_service()
    print(f"\n테스트 완료 시간: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    sys.exit(0 if success else 1) 
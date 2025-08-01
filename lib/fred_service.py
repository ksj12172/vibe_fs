import os
from typing import Optional
from fredapi import Fred
from dotenv import load_dotenv

# .env 파일 로드
load_dotenv()

# 참고: https://junyoru.tistory.com/122
class FredService:
    def __init__(self):
        api_key = self._get_api_key()
        self.fred = Fred(api_key=api_key)

    def _get_api_key(self) -> str:
        """FRED API 키를 안전하게 가져옵니다."""
        api_key = os.getenv('FRED_API_KEY')
        
        if not api_key:
            raise ValueError(
                "FRED_API_KEY 환경변수가 설정되지 않았습니다.\n"
                "다음 중 하나의 방법으로 설정하세요:\n"
                "1. .env 파일에 FRED_API_KEY=your_api_key_here 추가\n"
                "2. 환경변수 설정: export FRED_API_KEY='your_api_key_here'\n"
                "FRED API 키는 https://fred.stlouisfed.org/docs/api/api_key.html 에서 발급받을 수 있습니다."
            )
        
        return api_key

    # M2SL: https://fred.stlouisfed.org/series/M2SL
    def get_series(self, series_id: str):
        """지정된 시리즈 ID의 데이터를 가져옵니다."""
        return self.fred.get_series(series_id)

import os
from typing import Optional
from dotenv import load_dotenv

# .env 파일 로드
load_dotenv()

class Config:
    """애플리케이션 설정을 관리하는 클래스"""
    
    @staticmethod
    def get_fred_api_key() -> str:
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
    
    @staticmethod
    def get_env_var(key: str, default: Optional[str] = None, required: bool = True) -> Optional[str]:
        """환경변수를 안전하게 가져오는 헬퍼 메서드"""
        value = os.getenv(key, default)
        
        if required and not value:
            raise ValueError(f"Required environment variable '{key}' is not set.")
        
        return value 
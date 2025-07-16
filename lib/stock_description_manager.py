import json
import os
from typing import Dict, Optional

class StockDescriptionManager:
    """주식별 description 정보 관리 도구"""
    
    def __init__(self, file_path: str = None):
        if file_path is None:
            file_path = os.path.join(os.path.dirname(__file__), 'company.json')
        self.file_path = file_path
        self.descriptions = self._load_descriptions()
    
    def _load_descriptions(self) -> Dict:
        """description 파일 로드"""
        try:
            if os.path.exists(self.file_path):
                with open(self.file_path, 'r', encoding='utf-8') as f:
                    return json.load(f)
            else:
                print(f"Description 파일이 존재하지 않습니다: {self.file_path}")
                return {}
        except Exception as e:
            print(f"Description 파일 로드 중 오류: {e}")
            return {}
    
    def _save_descriptions(self):
        """description 파일 저장"""
        try:
            with open(self.file_path, 'w', encoding='utf-8') as f:
                json.dump(self.descriptions, f, ensure_ascii=False, indent=2)
            print(f"Description 파일 저장 완료: {self.file_path}")
        except Exception as e:
            print(f"Description 파일 저장 중 오류: {e}")
    
    def add_description(self, stock_code: str, description: str, sector: str = None, 
                       industry: str = None, website: str = None, founded: str = None, 
                       headquarters: str = None):
        """주식 description 추가/수정"""
        self.descriptions[stock_code] = {
            'description': description,
            'sector': sector,
            'industry': industry,
            'website': website,
            'founded': founded,
            'headquarters': headquarters
        }
        self._save_descriptions()
        print(f"✅ {stock_code} description 추가/수정 완료")
    
    def get_description(self, stock_code: str) -> Optional[Dict]:
        """주식 description 조회"""
        return self.descriptions.get(stock_code)
    
    def remove_description(self, stock_code: str):
        """주식 description 삭제"""
        if stock_code in self.descriptions:
            del self.descriptions[stock_code]
            self._save_descriptions()
            print(f"✅ {stock_code} description 삭제 완료")
        else:
            print(f"❌ {stock_code} description이 존재하지 않습니다")
    
    def list_descriptions(self):
        """모든 description 목록 조회"""
        print(f"\n📋 등록된 주식 description 목록 ({len(self.descriptions)}개)")
        print("-" * 80)
        
        for stock_code, info in self.descriptions.items():
            print(f"종목코드: {stock_code}")
            print(f"설명: {info.get('description', 'N/A')[:100]}...")
            print(f"섹터: {info.get('sector', 'N/A')}")
            print(f"산업: {info.get('industry', 'N/A')}")
            print("-" * 80)
    
    def search_descriptions(self, keyword: str):
        """키워드로 description 검색"""
        results = []
        keyword_lower = keyword.lower()
        
        for stock_code, info in self.descriptions.items():
            description = info.get('description', '').lower()
            sector = info.get('sector', '').lower()
            industry = info.get('industry', '').lower()
            
            if (keyword_lower in description or 
                keyword_lower in sector or 
                keyword_lower in industry):
                results.append((stock_code, info))
        
        print(f"\n🔍 '{keyword}' 검색 결과 ({len(results)}개)")
        print("-" * 80)
        
        for stock_code, info in results:
            print(f"종목코드: {stock_code}")
            print(f"설명: {info.get('description', 'N/A')[:100]}...")
            print(f"섹터: {info.get('sector', 'N/A')}")
            print("-" * 80)
        
        return results

def main():
    """관리 도구 실행"""
    manager = StockDescriptionManager()
    
    print("📊 주식 Description 관리 도구")
    print("=" * 50)
    
    while True:
        print("\n1. Description 목록 조회")
        print("2. Description 추가/수정")
        print("3. Description 조회")
        print("4. Description 삭제")
        print("5. 키워드 검색")
        print("6. 종료")
        
        choice = input("\n선택하세요 (1-6): ").strip()
        
        if choice == '1':
            manager.list_descriptions()
        
        elif choice == '2':
            stock_code = input("종목코드: ").strip()
            description = input("설명: ").strip()
            sector = input("섹터 (선택사항): ").strip() or None
            industry = input("산업 (선택사항): ").strip() or None
            website = input("웹사이트 (선택사항): ").strip() or None
            founded = input("설립연도 (선택사항): ").strip() or None
            headquarters = input("본사위치 (선택사항): ").strip() or None
            
            manager.add_description(stock_code, description, sector, industry, website, founded, headquarters)
        
        elif choice == '3':
            stock_code = input("종목코드: ").strip()
            info = manager.get_description(stock_code)
            if info:
                print(f"\n📋 {stock_code} 정보:")
                for key, value in info.items():
                    print(f"{key}: {value}")
            else:
                print(f"❌ {stock_code} description이 존재하지 않습니다")
        
        elif choice == '4':
            stock_code = input("종목코드: ").strip()
            manager.remove_description(stock_code)
        
        elif choice == '5':
            keyword = input("검색 키워드: ").strip()
            manager.search_descriptions(keyword)
        
        elif choice == '6':
            print("👋 관리 도구를 종료합니다")
            break
        
        else:
            print("❌ 잘못된 선택입니다")

if __name__ == "__main__":
    main() 
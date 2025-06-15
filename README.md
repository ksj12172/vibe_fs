# 📊 재무제표 시각화 웹 애플리케이션

DART API를 활용한 한국 상장기업 재무정보 분석 및 시각화 플랫폼입니다.

## ✨ 주요 기능

- 🔍 **기업 검색**: 한국 상장기업 실시간 검색
- 📈 **재무상태표**: 자산총계, 부채총계, 자본총계 시각화
- 💰 **손익계산서**: 매출액, 영업이익, 당기순이익 비교
- 📊 **재무비율 분석**:
  - 수익성 분석 (방사형 차트): ROE, ROA, 영업이익률, 순이익률
  - 부채비율 분석 (원형 차트): 자기자본 vs 부채 비율

## 🚀 기술 스택

- **Frontend**: Next.js 15, React 18
- **Charts**: Chart.js, React-Chart.js-2
- **Database**: Better-SQLite3
- **API**: DART Open API
- **Styling**: Custom CSS

## 🛠️ 로컬 개발 환경 설정

1. **저장소 클론**

```bash
git clone <repository-url>
cd vibe_fs
```

2. **의존성 설치**

```bash
npm install
```

3. **환경 변수 설정**
   `.env.local` 파일을 생성하고 DART API 키를 설정하세요:

```
DART_API_KEY=your_dart_api_key_here
```

4. **회사코드 데이터 다운로드**

먼저 회사코드 데이터를 다운로드해야 합니다:

```bash
yarn download
```

5. **데이터베이스 설정**

JSON 데이터를 SQLite 데이터베이스로 마이그레이션합니다:

```bash
yarn setup-db
```

## 🌐 배포하기

### Vercel 배포 (추천)

1. **Vercel CLI 설치**

```bash
npm install -g vercel
```

2. **Vercel 로그인**

```bash
vercel login
```

3. **배포 실행**

```bash
vercel
```

## 🔧 API 엔드포인트

### 회사 검색

- **URL**: `/api/search-company`
- **메소드**: `GET`
- **파라미터**: `query` (회사명)
- **응답**: 검색된 회사 목록

### 재무제표 데이터 조회

- **URL**: `/api/financial-data`
- **메소드**: `GET`
- **파라미터**:
  - `corp_code`: 회사코드 (8자리)
  - `bsns_year`: 사업연도 (YYYY)
  - `reprt_code`: 보고서 코드
    - `11011`: 사업보고서 (연간)
    - `11012`: 반기보고서
    - `11013`: 1분기보고서
    - `11014`: 3분기보고서

## 🎯 사용법

1. 회사명 검색 (예: 삼성전자, 카카오)
2. 원하는 기업 선택
3. 사업연도 및 보고서 유형 선택
4. 재무제표 조회 버튼 클릭
5. 3가지 차트로 재무정보 확인

## 📊 차트 설명

- **재무상태표**: 당기/전기 비교 바 차트
- **손익계산서**: 당기/전기 비교 바 차트
- **재무비율**: 수익성(방사형) + 부채비율(원형) 차트

## 💾 데이터베이스

이 애플리케이션은 **SQLite**를 사용하여 회사 정보를 저장합니다:

- **테이블**: `companies`
- **인덱스**: corp_code, corp_name, stock_code에 인덱스 적용
- **성능**: WAL 모드로 동시 읽기 성능 최적화
- **검색**: LIKE 쿼리로 유연한 회사명 검색 지원

### 데이터베이스 스키마

```sql
CREATE TABLE companies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  corp_code TEXT UNIQUE NOT NULL,
  corp_name TEXT NOT NULL,
  corp_eng_name TEXT,
  stock_code TEXT,
  modify_date TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## 💾 데이터베이스

이 애플리케이션은 **SQLite**를 사용하여 회사 정보를 저장합니다:

- **테이블**: `companies`
- **인덱스**: corp_code, corp_name, stock_code에 인덱스 적용
- **성능**: WAL 모드로 동시 읽기 성능 최적화
- **검색**: LIKE 쿼리로 유연한 회사명 검색 지원

### 데이터베이스 스키마

```sql
CREATE TABLE companies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  corp_code TEXT UNIQUE NOT NULL,
  corp_name TEXT NOT NULL,
  corp_eng_name TEXT,
  stock_code TEXT,
  modify_date TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

## 🔧 주요 파일 구조

```

vibe_fs/
├── app/
│ ├── api/
│ │ ├── search-company/
│ │ └── financial-data/
│ ├── globals.css
│ └── page.js
├── components/
│ ├── CompanySearch.js
│ ├── FinancialOptions.js
│ ├── FinancialChart.js
│ └── FinancialRatios.js
├── lib/
│ └── database.js
└── data/
└── companies.db

```

## 📄 라이선스

MIT License

## 🤝 기여하기

버그 리포트나 기능 제안은 이슈로 등록해주세요.

---

**Made with ❤️ for Korean Financial Data Analysis**
```

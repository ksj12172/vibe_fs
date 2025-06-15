# 📊 재무제표 시각화 웹 애플리케이션

한국 상장기업의 재무제표를 쉽게 조회하고 시각화할 수 있는 웹 애플리케이션입니다.

## ✨ 주요 기능

1. **회사 검색**: 회사명으로 검색하여 회사코드 조회
2. **재무제표 조회**: Open DART API를 통한 재무제표 데이터 가져오기
3. **데이터 시각화**: Chart.js를 이용한 재무상태표/손익계산서 차트
4. **상세 데이터**: 테이블 형태로 상세 재무정보 제공

## 🚀 설치 및 실행

### 1. 의존성 설치

```bash
yarn install
```

### 2. 환경 변수 설정

`.env` 파일에 Open DART API 키를 설정해주세요:

```
OPENAI_API_KEY=your_dart_api_key_here
```

### 3. 회사코드 데이터 다운로드

먼저 회사코드 데이터를 다운로드해야 합니다:

```bash
yarn download
```

### 4. 데이터베이스 설정

JSON 데이터를 SQLite 데이터베이스로 마이그레이션합니다:

```bash
yarn setup-db
```

### 5. 서버 실행

```bash
yarn start
```

또는 개발 모드로 실행:

```bash
yarn dev
```

### 6. 웹 브라우저에서 접속

```
http://localhost:3000
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

## 📁 프로젝트 구조

```
├── download_corp_code.js    # 회사코드 다운로드 스크립트
├── setup-database.js       # SQLite 데이터베이스 설정 스크립트
├── server.js               # Express 서버
├── package.json           # 프로젝트 설정
├── .env                   # 환경 변수 (API 키)
├── data/                  # 데이터베이스 파일
│   └── companies.db      # SQLite 데이터베이스
├── downloads/             # 다운로드된 데이터
│   └── corpCodes.json    # 회사코드 JSON 데이터 (임시)
└── public/               # 프론트엔드 파일
    ├── index.html        # 메인 페이지
    ├── styles.css        # 스타일시트
    └── app.js           # 프론트엔드 JavaScript
```

## 🔍 사용 방법

1. **회사 검색**: 검색창에 회사명을 입력하여 검색
2. **회사 선택**: 검색 결과에서 원하는 회사 클릭
3. **옵션 설정**: 사업연도와 보고서 유형 선택
4. **데이터 조회**: "재무제표 조회" 버튼 클릭
5. **시각화 확인**: 재무상태표/손익계산서 차트와 상세 테이블 확인

## 📊 시각화 기능

- **재무상태표**: 주요 자산, 부채, 자본 항목을 막대 차트로 표시
- **손익계산서**: 매출, 비용, 이익 항목을 막대 차트로 표시
- **상세 테이블**: 모든 계정 항목의 당기/전기 금액 비교

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

## ⚠️ 주의사항

1. **API 키 필요**: Open DART API 키가 필요합니다
2. **데이터 제한**: 2015년 이후 데이터만 제공됩니다
3. **요청 제한**: API 요청 횟수 제한이 있을 수 있습니다
4. **네트워크 연결**: 인터넷 연결이 필요합니다
5. **데이터베이스 설정**: 첫 실행 전 `yarn setup-db` 필수

## 🛠️ 기술 스택

- **백엔드**: Node.js, Express
- **데이터베이스**: SQLite (better-sqlite3)
- **프론트엔드**: HTML, CSS, JavaScript
- **시각화**: Chart.js
- **데이터**: Open DART API, JSON
- **스타일링**: CSS Grid, Flexbox

## 📝 라이선스

MIT License

## 🤝 기여하기

버그 리포트나 기능 제안은 이슈로 등록해주세요.

---

**Made with ❤️ for Korean Financial Data Analysis**

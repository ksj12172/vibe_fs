# 📊 재무제표 시각화 웹 애플리케이션

한국 상장기업의 재무제표 데이터를 시각화하는 웹 애플리케이션입니다. Open DART API를 활용하여 실시간 재무 데이터를 조회하고 차트로 표시합니다.

## 🌟 주요 기능

- **회사 검색**: 한국 상장기업 및 등록기업 검색
- **재무제표 시각화**: 손익계산서, 재무상태표, 현금흐름표 차트 표시
- **실시간 데이터**: Open DART API를 통한 최신 재무 데이터 조회
- **반응형 디자인**: 데스크톱과 모바일 모두 지원

## 🚀 설치 및 실행

### 필수 요구사항

- Node.js (18.0.0 이상)
- Yarn 또는 npm
- PostgreSQL 데이터베이스 (Vercel Postgres 권장)

### 환경 설정

1. **레포지토리 클론**

   ```bash
   git clone <repository-url>
   cd vibe-fs
   ```

2. **의존성 설치**

   ```bash
   yarn install
   # 또는
   npm install
   ```

3. **환경변수 설정**
   `.env` 파일을 생성하고 다음 내용을 추가하세요:

   ```env
   # DART API 키 (https://opendart.fss.or.kr/에서 발급)
   DART_API_KEY=your_dart_api_key_here

   # PostgreSQL 연결 정보 (Vercel Postgres 사용 시 자동 설정)
   POSTGRES_URL="your_postgres_connection_url"
   POSTGRES_PRISMA_URL="your_postgres_prisma_url"
   POSTGRES_URL_NON_POOLING="your_postgres_non_pooling_url"
   POSTGRES_USER="your_postgres_user"
   POSTGRES_HOST="your_postgres_host"
   POSTGRES_PASSWORD="your_postgres_password"
   POSTGRES_DATABASE="your_postgres_database"
   ```

### 데이터베이스 설정

1. **회사 코드 다운로드**

   ```bash
   yarn download
   ```

2. **PostgreSQL 데이터베이스 설정**
   ```bash
   yarn setup-postgres
   ```

### 서버 실행

```bash
# 개발 모드
yarn dev

# 프로덕션 모드
yarn build
yarn start
```

애플리케이션이 `http://localhost:3000`에서 실행됩니다.

## 📊 API 엔드포인트

### 회사 검색

```
GET /api/search-company?query=삼성전자
```

### 재무제표 데이터 조회

```
GET /api/financial-data?corp_code={회사코드}&bsns_year={사업연도}&reprt_code={보고서코드}
```

**보고서 코드:**

- `11013`: 사업보고서
- `11012`: 반기보고서
- `11014`: 1분기보고서
- `11011`: 3분기보고서

## 🛠️ 기술 스택

### Frontend

- **Next.js 14**: React 기반 풀스택 프레임워크
- **Chart.js**: 데이터 시각화
- **React Chart.js 2**: Chart.js의 React 래퍼
- **CSS**: 반응형 스타일링

### Backend

- **Node.js**: 서버 런타임
- **Express.js**: 웹 프레임워크
- **PostgreSQL**: 데이터베이스 (Vercel Postgres)
- **@vercel/postgres**: PostgreSQL 클라이언트

### 외부 API

- **Open DART API**: 금융감독원 전자공시시스템 API

## 📁 프로젝트 구조

```
vibe-fs/
├── app/                    # Next.js 앱 라우터
├── components/             # React 컴포넌트
├── lib/                   # 유틸리티 및 데이터베이스
│   └── postgres-database.js  # PostgreSQL 데이터베이스 매니저
├── public/                # 정적 파일
├── scripts/               # 스크립트 파일
│   ├── download_corp_code.js    # 회사코드 다운로드
│   └── migrate-to-postgres.js   # PostgreSQL 설정
├── downloads/             # 다운로드된 파일
├── server.js             # Express 서버
└── package.json          # 의존성 및 스크립트
```

## 🔧 개발 도구

### 사용 가능한 스크립트

```bash
# 개발 서버 시작
yarn dev

# 프로덕션 빌드
yarn build

# 프로덕션 서버 시작
yarn start

# 린트 검사
yarn lint

# 회사코드 다운로드
yarn download

# PostgreSQL 데이터베이스 설정
yarn setup-postgres
```

## 📋 데이터베이스 스키마

### companies 테이블

```sql
CREATE TABLE companies (
  id SERIAL PRIMARY KEY,
  corp_code VARCHAR(8) UNIQUE NOT NULL,
  corp_name VARCHAR(255) NOT NULL,
  corp_eng_name VARCHAR(255),
  stock_code VARCHAR(6),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 🔒 보안 고려사항

- **API 키 보안**: 환경변수를 통한 API 키 관리
- **SQL Injection 방지**: Prepared Statement 사용
- **CORS 설정**: 적절한 CORS 정책 적용

## 🚨 문제 해결

### 자주 발생하는 문제

1. **DART API 키 오류**

   - `.env` 파일의 `DART_API_KEY` 확인
   - Open DART에서 발급받은 정확한 키 사용

2. **데이터베이스 연결 오류**

   - PostgreSQL 연결 정보 확인
   - `yarn setup-postgres` 실행 여부 확인

3. **회사 검색 결과 없음**
   - `yarn download` 실행 여부 확인
   - 데이터베이스에 회사 데이터 존재 여부 확인

## 📄 라이선스

MIT License

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📞 문의

프로젝트에 대한 질문이나 제안사항이 있으시면 이슈를 생성해 주세요.

```

```

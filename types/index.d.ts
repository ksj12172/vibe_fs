// 재무 API 관련 전역 타입 선언

declare global {
  interface FinancialItem {
    account_nm?: string; // 항목명: 예) "유동자산"
    bsns_year?: string; // 사업연도: 예) "2025"
    corp_code?: string; // 기업 고유번호 (금감원 코드): 예) "00258801"
    currency?: string; // 통화 단위: 예) "KRW"
    frmtrm_amount?: string; // 전기 금액: 예) "10,721,670,330,953"
    frmtrm_dt?: string; // 전기 기준일: 예) "2024.12.31 현재"
    frmtrm_nm?: string; // 전기 명칭: 예) "제 30 기말"
    fs_div?: string; // 재무제표 구분 코드: 예) "CFS" (연결), "OFS" (개별)
    fs_nm?: string; // 재무제표 구분명: 예) "연결재무제표"
    ord?: string; // 출력 순서: 예) "1"
    rcept_no?: string; // 전자공시 접수번호: 예) "20250514001239"
    reprt_code?: string; // 보고서 코드: 예) "11013" (1분기), "11011" (사업보고서)
    sj_div?: string; // 재무제표 종류 코드: 예) "BS" (재무상태표), "IS" (손익계산서)
    sj_nm?: string; // 재무제표 종류명: 예) "재무상태표"
    stock_code?: string; // 종목코드: 예) "035720" (카카오)
    thstrm_amount?: string; // 당기 금액: 예) "10,639,789,556,979"
    thstrm_dt?: string; // 당기 기준일: 예) "2025.03.31 현재"
    thstrm_nm?: string; // 당기 명칭: 예) "제 31 기1분기말"
  }

  interface FinancialApiResponse {
    status: string; // API 상태 코드
    message?: string; // 메시지
    list?: FinancialItem[]; // 재무데이터 목록
  }

  interface Company {
    id?: string;
    corp_name?: string;
    corp_code?: string;
    stock_code?: string;
  }

  interface ReportOption {
    value: string;
    label: string;
  }

  type ChartType = "bs" | "is";
}

// 이 파일을 모듈로 만들기 위한 빈 export
export {};

"use client";

import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Title,
  Tooltip,
} from "chart.js";
import { Bar } from "react-chartjs-2";

// API 응답값 타입 정의
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

type ChartType = "bs" | "is";

// Props 타입 정의
interface FinancialChartProps {
  selectedCompany?: Company;
  financialData?: FinancialApiResponse;
  chartType: ChartType;
  currentYear?: string;
}

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function FinancialChart({
  selectedCompany,
  financialData,
  chartType,
  currentYear,
}: FinancialChartProps) {
  const getFilteredFinancialData = (): FinancialItem[] => {
    if (!financialData?.list) return [];

    // 연결재무제표 우선, 없으면 개별재무제표 사용
    const consolidatedData = financialData.list.filter(
      (item) => item.fs_div === "CFS"
    );

    const individualData = financialData.list.filter(
      (item) => item.fs_div === "OFS"
    );

    return consolidatedData.length > 0 ? consolidatedData : individualData;
  };

  const formatNumberWithUnit = (value: number): string => {
    if (value >= 1000000000000) {
      return (value / 1000000000000).toFixed(1) + "조원";
    } else if (value >= 100000000) {
      return (value / 100000000).toFixed(1) + "억원";
    } else if (value >= 10000) {
      return (value / 10000).toFixed(1) + "만원";
    } else {
      return new Intl.NumberFormat("ko-KR").format(value) + "원";
    }
  };

  const getChartData = () => {
    const filteredData = getFilteredFinancialData();

    let targetItems: string[] = [];
    let chartTitle = "";

    if (chartType === "bs") {
      // 재무상태표: 자산총계, 부채총계, 자본총계
      targetItems = ["자산총계", "부채총계", "자본총계"];
      chartTitle = "재무상태표 주요 항목";
    } else if (chartType === "is") {
      // 손익계산서: 매출액, 영업이익, 당기순이익
      targetItems = ["매출액", "영업이익", "당기순이익"];
      chartTitle = "손익계산서 주요 항목";
    }

    // 해당 항목들 찾기
    const chartData: FinancialItem[] = [];
    targetItems.forEach((itemName) => {
      const item = filteredData.find(
        (data) => data.account_nm && data.account_nm.includes(itemName)
      );
      if (item) {
        chartData.push(item);
      }
    });

    if (chartData.length === 0) {
      return null;
    }

    // bsns_year를 사용하여 동적으로 연도 라벨 생성
    const businessYear = chartData[0]?.bsns_year;
    const currentYearLabel = businessYear || currentYear || "";
    const previousYearLabel = currentYearLabel
      ? (parseInt(currentYearLabel) - 1).toString()
      : "";

    const labels = chartData.map((item) => item.account_nm || "");
    const currentData = chartData.map((item) => {
      const value = parseInt(item.thstrm_amount?.replace(/,/g, "") || "0");
      return isNaN(value) ? 0 : value / 100000000; // 억원 단위로 변환
    });
    const previousData = chartData.map((item) => {
      const value = parseInt(item.frmtrm_amount?.replace(/,/g, "") || "0");
      return isNaN(value) ? 0 : value / 100000000; // 억원 단위로 변환
    });

    return {
      labels,
      datasets: [
        {
          label: `${currentYearLabel}년 (당기)`,
          data: currentData,
          backgroundColor: "rgba(54, 162, 235, 0.8)",
          borderColor: "rgba(54, 162, 235, 1)",
          borderWidth: 1,
        },
        {
          label: `${previousYearLabel}년 (전기)`,
          data: previousData,
          backgroundColor: "rgba(255, 99, 132, 0.8)",
          borderColor: "rgba(255, 99, 132, 1)",
          borderWidth: 1,
        },
      ],
      chartTitle,
      currentYearLabel, // 차트 제목에서 사용할 수 있도록 반환
    };
  };

  const chartData = getChartData();

  if (!chartData) {
    return (
      <div style={{ textAlign: "center", padding: "2rem" }}>
        <p>해당 유형의 데이터가 없습니다.</p>
      </div>
    );
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: {
        display: true,
        text: `${selectedCompany?.corp_name} - ${chartData.chartTitle} (${chartData.currentYearLabel})`,
        font: {
          size: 16,
          weight: "bold" as const,
        },
      },
      legend: {
        position: "top" as const,
      },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            const value = context.parsed.y * 100000000;
            const formattedValue = formatNumberWithUnit(value);
            return context.dataset.label + ": " + formattedValue;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: "금액 (억원)",
        },
        ticks: {
          callback: function (value: any) {
            return value.toLocaleString() + "억";
          },
        },
      },
      x: {
        ticks: {
          maxRotation: 45,
          minRotation: 0,
        },
      },
    },
  };

  return <Bar data={chartData} options={options} />;
}

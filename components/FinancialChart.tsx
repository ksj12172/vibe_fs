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

  const renderIncomeStatementExplanation = () => {
    if (chartType !== "is") return null;

    return (
      <div
        style={{
          marginTop: "20px",
          padding: "16px",
          backgroundColor: "#f8f9fa",
          borderRadius: "8px",
          fontSize: "14px",
          lineHeight: "1.6",
        }}
      >
        <h4
          style={{ margin: "0 0 12px 0", color: "#495057", fontSize: "16px" }}
        >
          📊 손익계산서 주요 계산식
        </h4>
        <div style={{ display: "grid", gap: "8px" }}>
          <div>
            <strong style={{ color: "#007bff" }}>영업이익</strong> = 매출액 -
            (매출원가 + 판매비와관리비)
          </div>
          <div>
            <strong style={{ color: "#28a745" }}>법인세비용차감전순이익</strong>{" "}
            = 영업이익 + 영업외수익 - 영업외비용
          </div>
          <div>
            <strong style={{ color: "#dc3545" }}>당기순이익</strong> =
            법인세비용차감전순이익 - 법인세비용
          </div>
        </div>
        <div
          style={{
            marginTop: "12px",
            padding: "8px",
            backgroundColor: "#e9ecef",
            borderRadius: "4px",
            fontSize: "12px",
            color: "#6c757d",
          }}
        >
          💡 손익계산서는 일정 기간 동안의 수익성을 보여주는 재무제표입니다.
        </div>
      </div>
    );
  };

  return (
    <div>
      <div
        style={{
          height: chartType === "is" ? "400px" : "500px",
          marginBottom: "20px",
        }}
      >
        <Bar data={chartData} options={options} />
      </div>
      {renderIncomeStatementExplanation()}
    </div>
  );
}

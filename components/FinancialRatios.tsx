"use client";

import {
  ArcElement,
  Chart as ChartJS,
  Filler,
  Legend,
  LineElement,
  PointElement,
  RadialLinearScale,
  Tooltip,
} from "chart.js";
import { useEffect, useState } from "react";
import { Doughnut, Radar } from "react-chartjs-2";

// 재무 데이터 타입 정의
interface FinancialItem {
  fs_div?: string;
  sj_div?: string;
  account_nm?: string;
  thstrm_amount?: string;
}

interface FinancialData {
  list?: FinancialItem[];
}

interface Company {
  id?: string;
  symbol_name?: string;
  stock_code?: string;
}

// 재무 비율 타입 정의
interface FinancialRatios {
  roe: number;
  roa: number;
  operatingMargin: number;
  netProfitMargin: number;
  debtRatio: number;
  equityRatio: number;
  currentRatio: number;
  currentAssets: number;
  currentLiabilities: number;
}

// Props 타입 정의
interface FinancialRatiosProps {
  selectedCompany?: Company;
  financialData?: FinancialData;
}

type RatioType = "profitability" | "debt" | "liquidity";

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  ArcElement
);

export default function FinancialRatios({
  selectedCompany,
  financialData,
}: FinancialRatiosProps) {
  const [ratios, setRatios] = useState<FinancialRatios>({
    roe: 0,
    roa: 0,
    operatingMargin: 0,
    netProfitMargin: 0,
    debtRatio: 0,
    equityRatio: 0,
    currentRatio: 0,
    currentAssets: 0,
    currentLiabilities: 0,
  });

  useEffect(() => {
    if (financialData?.list) {
      calculateRatios();
    }
  }, [financialData]);

  const getFilteredFinancialData = (): FinancialItem[] => {
    if (!financialData?.list) return [];

    const consolidatedData = financialData.list.filter(
      (item) => item.fs_div === "CFS"
    );

    const individualData = financialData.list.filter(
      (item) => item.fs_div === "OFS"
    );

    return consolidatedData.length > 0 ? consolidatedData : individualData;
  };

  const getAccountAmount = (
    data: FinancialItem[],
    accountNames: string[]
  ): number => {
    for (const name of accountNames) {
      const account = data.find(
        (item) => item.account_nm && item.account_nm.includes(name)
      );
      if (account && account.thstrm_amount) {
        return parseInt(account.thstrm_amount.replace(/,/g, "")) || 0;
      }
    }
    return 0;
  };

  const calculateRatios = (): void => {
    const filteredData = getFilteredFinancialData();
    const bsData = filteredData.filter((item) => item.sj_div === "BS");
    const isData = filteredData.filter((item) => item.sj_div === "IS");

    // 재무상태표 주요 계정
    const totalAssets = getAccountAmount(bsData, ["자산총계", "총자산"]);
    const totalLiabilities = getAccountAmount(bsData, ["부채총계", "총부채"]);
    const totalEquity = getAccountAmount(bsData, [
      "자본총계",
      "총자본",
      "자기자본",
    ]);

    // 유동성 분석을 위한 계정
    const currentAssets = getAccountAmount(bsData, ["유동자산"]);
    const currentLiabilities = getAccountAmount(bsData, ["유동부채"]);

    // 손익계산서 주요 계정
    const revenue = getAccountAmount(isData, [
      "매출액",
      "수익(매출액)",
      "영업수익",
    ]);
    const netIncome = getAccountAmount(isData, ["당기순이익", "순이익"]);
    const operatingIncome = getAccountAmount(isData, ["영업이익"]);

    // 비율 계산
    const calculatedRatios: FinancialRatios = {
      roe: totalEquity > 0 ? (netIncome / totalEquity) * 100 : 0,
      roa: totalAssets > 0 ? (netIncome / totalAssets) * 100 : 0,
      operatingMargin: revenue > 0 ? (operatingIncome / revenue) * 100 : 0,
      netProfitMargin: revenue > 0 ? (netIncome / revenue) * 100 : 0,
      debtRatio: totalAssets > 0 ? (totalLiabilities / totalAssets) * 100 : 0,
      equityRatio: totalAssets > 0 ? (totalEquity / totalAssets) * 100 : 0,
      currentRatio:
        currentLiabilities > 0 ? (currentAssets / currentLiabilities) * 100 : 0,
      // 유동성 분석을 위한 원시 데이터
      currentAssets: currentAssets,
      currentLiabilities: currentLiabilities,
    };

    setRatios(calculatedRatios);
  };

  const formatRatioValue = (value: number, unit: string): string => {
    if (value === 0 || isNaN(value)) return "-";
    return `${value.toFixed(1)}${unit}`;
  };

  const formatAmountValue = (amount: number): string => {
    if (!amount || amount === 0 || isNaN(amount)) return "-";

    const absAmount = Math.abs(amount);

    if (absAmount >= 1000000000000) {
      // 1조 이상
      return `${(amount / 1000000000000).toFixed(1)}조원`;
    } else if (absAmount >= 100000000) {
      // 1억 이상
      return `${(amount / 100000000).toFixed(1)}억원`;
    } else if (absAmount >= 10000) {
      // 1만 이상
      return `${(amount / 10000).toFixed(1)}만원`;
    } else {
      return `${new Intl.NumberFormat("ko-KR").format(amount)}원`;
    }
  };

  const getRatioClass = (value: number, type: RatioType): string => {
    if (value === 0 || isNaN(value)) return "ratio-value";

    let className = "ratio-value";

    if (type === "profitability") {
      if (value > 0) className += " positive";
      else if (value < 0) className += " negative";
      else className += " neutral";
    } else if (type === "debt") {
      if (value < 50) className += " positive";
      else if (value > 100) className += " negative";
      else className += " neutral";
    } else if (type === "liquidity") {
      if (value >= 100) className += " positive";
      else if (value >= 80) className += " neutral";
      else className += " negative";
    }

    return className;
  };

  const getCurrentRatioDescription = (ratio: number): string => {
    if (ratio === 0 || isNaN(ratio)) return "데이터 없음";
    if (ratio >= 200) return "매우 양호";
    if (ratio >= 150) return "양호";
    if (ratio >= 100) return "보통";
    if (ratio >= 80) return "주의";
    return "위험 (유동성 부족)";
  };

  // 수익성 분석 레이더 차트
  const profitabilityRadarData = {
    labels: ["ROE", "ROA", "영업이익률", "순이익률"],
    datasets: [
      {
        label: "수익성 지표 (%)",
        data: [
          Math.max(0, Math.min(ratios.roe || 0, 50)), // 최대 50%로 제한
          Math.max(0, Math.min(ratios.roa || 0, 30)), // 최대 30%로 제한
          Math.max(0, Math.min(ratios.operatingMargin || 0, 50)), // 최대 50%로 제한
          Math.max(0, Math.min(ratios.netProfitMargin || 0, 50)), // 최대 50%로 제한
        ],
        backgroundColor: "rgba(54, 162, 235, 0.2)",
        borderColor: "rgba(54, 162, 235, 1)",
        borderWidth: 2,
        pointBackgroundColor: "rgba(54, 162, 235, 1)",
        pointBorderColor: "#fff",
        pointBorderWidth: 2,
        pointRadius: 5,
      },
    ],
  };

  // 부채비율 분석 도넛 차트
  const debtRatioData = {
    labels: ["자기자본", "부채"],
    datasets: [
      {
        data: [ratios.equityRatio || 0, ratios.debtRatio || 0],
        backgroundColor: ["rgba(75, 192, 192, 0.8)", "rgba(255, 99, 132, 0.8)"],
        borderColor: ["rgba(75, 192, 192, 1)", "rgba(255, 99, 132, 1)"],
        borderWidth: 2,
      },
    ],
  };

  const radarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: {
        display: true,
        text: "수익성 분석",
        font: {
          size: 16,
          weight: "bold" as const,
        },
      },
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            return `${context.label}: ${context.parsed.r.toFixed(1)}%`;
          },
        },
      },
    },
    scales: {
      r: {
        beginAtZero: true,
        max: 50,
        ticks: {
          stepSize: 10,
          callback: function (value: any) {
            return value + "%";
          },
        },
        grid: {
          color: "rgba(0, 0, 0, 0.1)",
        },
        angleLines: {
          color: "rgba(0, 0, 0, 0.1)",
        },
      },
    },
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: {
        display: true,
        text: "부채비율 분석",
        font: {
          size: 16,
          weight: "bold" as const,
        },
      },
      legend: {
        position: "bottom" as const,
      },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            return `${context.label}: ${context.parsed.toFixed(1)}%`;
          },
        },
      },
    },
  };

  return (
    <div className="financial-ratios-section">
      <h3>📊 주요 재무비율</h3>

      <div className="ratios-grid">
        <div className="ratio-card">
          <h4>💰 수익성 분석</h4>
          <div className="ratio-item">
            <span className="ratio-name">ROE (자기자본이익률)</span>
            <span className={getRatioClass(ratios.roe, "profitability")}>
              {formatRatioValue(ratios.roe, "%")}
            </span>
          </div>
          <div className="ratio-item">
            <span className="ratio-name">ROA (총자산이익률)</span>
            <span className={getRatioClass(ratios.roa, "profitability")}>
              {formatRatioValue(ratios.roa, "%")}
            </span>
          </div>
          <div className="ratio-item">
            <span className="ratio-name">영업이익률</span>
            <span
              className={getRatioClass(ratios.operatingMargin, "profitability")}
            >
              {formatRatioValue(ratios.operatingMargin, "%")}
            </span>
          </div>
          <div className="ratio-item">
            <span className="ratio-name">순이익률</span>
            <span
              className={getRatioClass(ratios.netProfitMargin, "profitability")}
            >
              {formatRatioValue(ratios.netProfitMargin, "%")}
            </span>
          </div>
        </div>

        <div className="ratio-card">
          <h4>🛡️ 안정성 분석</h4>
          <div className="ratio-item">
            <span className="ratio-name">부채비율</span>
            <span className={getRatioClass(ratios.debtRatio, "debt")}>
              {formatRatioValue(ratios.debtRatio, "%")}
            </span>
          </div>
          <div className="ratio-item">
            <span className="ratio-name">자기자본비율</span>
            <span className={getRatioClass(ratios.equityRatio, "debt")}>
              {formatRatioValue(ratios.equityRatio, "%")}
            </span>
          </div>
        </div>

        <div className="ratio-card">
          <h4>💧 유동성 분석</h4>
          <div className="ratio-item">
            <span className="ratio-name">유동비율</span>
            <span className={getRatioClass(ratios.currentRatio, "liquidity")}>
              {formatRatioValue(ratios.currentRatio, "%")}
            </span>
          </div>
          <div className="liquidity-amounts">
            <div className="amount-item">
              <span className="amount-label">💰 유동자산:</span>
              <span className="amount-value">
                {formatAmountValue(ratios.currentAssets)}
              </span>
            </div>
            <div className="amount-item">
              <span className="amount-label">💳 유동부채:</span>
              <span className="amount-value">
                {formatAmountValue(ratios.currentLiabilities)}
              </span>
            </div>
          </div>
          <div className="liquidity-description">
            <p className="ratio-formula">
              <strong>📈 계산식:</strong> 유동자산 ÷ 유동부채 × 100
            </p>
            <p className="ratio-explanation">
              <strong>💡 평가:</strong>{" "}
              {getCurrentRatioDescription(ratios.currentRatio)}
            </p>
            <p className="ratio-warning">
              <strong>⚠️ 주의:</strong> 100% 미만이면 유동성이 위험한
              상태입니다. 단기부채를 상환할 유동자산이 부족할 수 있습니다.
            </p>
          </div>
        </div>
      </div>

      <div className="additional-charts">
        <div className="profit-margin-chart">
          <div style={{ height: "400px" }}>
            <Radar data={profitabilityRadarData} options={radarOptions} />
          </div>
        </div>

        <div className="stability-chart">
          <div style={{ height: "400px" }}>
            <Doughnut data={debtRatioData} options={doughnutOptions} />
          </div>
        </div>
      </div>
    </div>
  );
}

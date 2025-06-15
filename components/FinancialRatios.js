'use client';

import { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
} from 'chart.js';
import { Radar, Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement
);

export default function FinancialRatios({ selectedCompany, financialData }) {
  const [ratios, setRatios] = useState({});

  useEffect(() => {
    if (financialData?.list) {
      calculateRatios();
    }
  }, [financialData]);

  const getFilteredFinancialData = () => {
    if (!financialData?.list) return [];

    const consolidatedData = financialData.list.filter(
      (item) => item.fs_div === 'CFS'
    );

    const individualData = financialData.list.filter(
      (item) => item.fs_div === 'OFS'
    );

    return consolidatedData.length > 0 ? consolidatedData : individualData;
  };

  const getAccountAmount = (data, accountNames) => {
    for (const name of accountNames) {
      const account = data.find(
        (item) => item.account_nm && item.account_nm.includes(name)
      );
      if (account && account.thstrm_amount) {
        return parseInt(account.thstrm_amount.replace(/,/g, '')) || 0;
      }
    }
    return 0;
  };

  const calculateRatios = () => {
    const filteredData = getFilteredFinancialData();
    const bsData = filteredData.filter((item) => item.sj_div === 'BS');
    const isData = filteredData.filter((item) => item.sj_div === 'IS');

    // 재무상태표 주요 계정
    const totalAssets = getAccountAmount(bsData, ['자산총계', '총자산']);
    const totalLiabilities = getAccountAmount(bsData, ['부채총계', '총부채']);
    const totalEquity = getAccountAmount(bsData, [
      '자본총계',
      '총자본',
      '자기자본',
    ]);
    const currentAssets = getAccountAmount(bsData, ['유동자산']);
    const currentLiabilities = getAccountAmount(bsData, ['유동부채']);
    const receivables = getAccountAmount(bsData, [
      '매출채권',
      '매출채권및기타채권',
    ]);

    // 손익계산서 주요 계정
    const revenue = getAccountAmount(isData, [
      '매출액',
      '수익(매출액)',
      '영업수익',
    ]);
    const netIncome = getAccountAmount(isData, ['당기순이익', '순이익']);
    const operatingIncome = getAccountAmount(isData, ['영업이익']);

    // 비율 계산
    const calculatedRatios = {
      roe: totalEquity > 0 ? (netIncome / totalEquity) * 100 : 0,
      roa: totalAssets > 0 ? (netIncome / totalAssets) * 100 : 0,
      operatingMargin: revenue > 0 ? (operatingIncome / revenue) * 100 : 0,
      netProfitMargin: revenue > 0 ? (netIncome / revenue) * 100 : 0,
      debtRatio: totalEquity > 0 ? (totalLiabilities / totalEquity) * 100 : 0,
      equityRatio: totalAssets > 0 ? (totalEquity / totalAssets) * 100 : 0,
      equityDebtRatio:
        totalLiabilities > 0 ? (totalEquity / totalLiabilities) * 100 : 0,
      currentRatio:
        currentLiabilities > 0 ? (currentAssets / currentLiabilities) * 100 : 0,
      assetTurnover: totalAssets > 0 ? revenue / totalAssets : 0,
      equityTurnover: totalEquity > 0 ? revenue / totalEquity : 0,
      receivablesTurnover: receivables > 0 ? revenue / receivables : 0,
    };

    setRatios(calculatedRatios);
  };

  const formatRatioValue = (value, unit, type) => {
    if (value === 0 || isNaN(value)) return '-';

    const formattedValue =
      type === 'turnover' ? value.toFixed(2) : value.toFixed(1);
    return `${formattedValue}${unit}`;
  };

  const getRatioClass = (value, type) => {
    if (value === 0 || isNaN(value)) return 'ratio-value';

    let className = 'ratio-value';

    if (type === 'percentage') {
      if (value > 0) className += ' positive';
      else if (value < 0) className += ' negative';
      else className += ' neutral';
    } else if (type === 'ratio') {
      if (value < 100) className += ' positive';
      else if (value > 200) className += ' negative';
      else className += ' neutral';
    } else if (type === 'turnover') {
      if (value > 1) className += ' positive';
      else if (value < 0.5) className += ' negative';
      else className += ' neutral';
    }

    return className;
  };

  // 레이더 차트 데이터
  const radarData = {
    labels: [
      'ROE',
      'ROA',
      '영업이익률',
      '순이익률',
      '안정성',
      '자기자본비율',
      '유동비율',
    ],
    datasets: [
      {
        label: '재무 비율 종합',
        data: [
          Math.min(Math.max((ratios.roe / 20) * 100, 0), 100),
          Math.min(Math.max((ratios.roa / 10) * 100, 0), 100),
          Math.min(Math.max((ratios.operatingMargin / 20) * 100, 0), 100),
          Math.min(Math.max((ratios.netProfitMargin / 15) * 100, 0), 100),
          Math.min(Math.max((200 - ratios.debtRatio) / 2, 0), 100),
          Math.min(Math.max(ratios.equityRatio, 0), 100),
          Math.min(Math.max(ratios.currentRatio / 2, 0), 100),
        ],
        backgroundColor: 'rgba(52, 152, 219, 0.2)',
        borderColor: 'rgba(52, 152, 219, 1)',
        borderWidth: 2,
        pointBackgroundColor: 'rgba(52, 152, 219, 1)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 5,
      },
    ],
  };

  // 수익성 지표 바 차트 데이터
  const profitabilityData = {
    labels: ['ROE', 'ROA', '영업이익률', '순이익률'],
    datasets: [
      {
        label: '수익성 지표 (%)',
        data: [
          ratios.roe?.toFixed(1) || 0,
          ratios.roa?.toFixed(1) || 0,
          ratios.operatingMargin?.toFixed(1) || 0,
          ratios.netProfitMargin?.toFixed(1) || 0,
        ],
        backgroundColor: ['#3498db', '#2ecc71', '#f39c12', '#e74c3c'],
        borderColor: ['#2980b9', '#27ae60', '#d68910', '#c0392b'],
        borderWidth: 1,
      },
    ],
  };

  // 안정성 지표 도넛 차트 데이터
  const stabilityData = {
    labels: ['자기자본', '부채'],
    datasets: [
      {
        data: [
          ratios.equityRatio?.toFixed(1) || 0,
          (100 - (ratios.equityRatio || 0)).toFixed(1),
        ],
        backgroundColor: ['#27ae60', '#e74c3c'],
        borderColor: ['#2c3e50', '#2c3e50'],
        borderWidth: 2,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: {
        display: true,
        text: `${selectedCompany?.corp_name} - 재무 비율 종합 분석`,
        font: {
          size: 16,
          weight: 'bold',
        },
      },
    },
    scales: {
      r: {
        beginAtZero: true,
        max: 100,
        ticks: {
          stepSize: 20,
        },
      },
    },
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function (value) {
            return value + '%';
          },
        },
      },
    },
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            return context.label + ': ' + context.parsed + '%';
          },
        },
      },
    },
  };

  return (
    <div className="financial-ratios-section">
      <h3>📊 주요 재무 비율</h3>
      <div className="ratios-grid">
        <div className="ratio-card">
          <h4>수익성 비율</h4>
          <div className="ratio-item">
            <span className="ratio-name">ROE (자기자본이익률)</span>
            <span className={getRatioClass(ratios.roe, 'percentage')}>
              {formatRatioValue(ratios.roe, '%', 'percentage')}
            </span>
          </div>
          <div className="ratio-item">
            <span className="ratio-name">ROA (총자산이익률)</span>
            <span className={getRatioClass(ratios.roa, 'percentage')}>
              {formatRatioValue(ratios.roa, '%', 'percentage')}
            </span>
          </div>
          <div className="ratio-item">
            <span className="ratio-name">영업이익률</span>
            <span
              className={getRatioClass(ratios.operatingMargin, 'percentage')}
            >
              {formatRatioValue(ratios.operatingMargin, '%', 'percentage')}
            </span>
          </div>
          <div className="ratio-item">
            <span className="ratio-name">매출액순이익률</span>
            <span
              className={getRatioClass(ratios.netProfitMargin, 'percentage')}
            >
              {formatRatioValue(ratios.netProfitMargin, '%', 'percentage')}
            </span>
          </div>
        </div>

        <div className="ratio-card">
          <h4>안정성 비율</h4>
          <div className="ratio-item">
            <span className="ratio-name">부채비율</span>
            <span className={getRatioClass(ratios.debtRatio, 'ratio')}>
              {formatRatioValue(ratios.debtRatio, '%', 'ratio')}
            </span>
          </div>
          <div className="ratio-item">
            <span className="ratio-name">자기자본비율</span>
            <span className={getRatioClass(ratios.equityRatio, 'percentage')}>
              {formatRatioValue(ratios.equityRatio, '%', 'percentage')}
            </span>
          </div>
          <div className="ratio-item">
            <span className="ratio-name">자기자본-부채 비율</span>
            <span
              className={getRatioClass(ratios.equityDebtRatio, 'percentage')}
            >
              {formatRatioValue(ratios.equityDebtRatio, '%', 'percentage')}
            </span>
          </div>
          <div className="ratio-item">
            <span className="ratio-name">유동비율</span>
            <span className={getRatioClass(ratios.currentRatio, 'ratio')}>
              {formatRatioValue(ratios.currentRatio, '%', 'ratio')}
            </span>
          </div>
        </div>

        <div className="ratio-card">
          <h4>활동성 비율</h4>
          <div className="ratio-item">
            <span className="ratio-name">총자산회전율</span>
            <span className={getRatioClass(ratios.assetTurnover, 'turnover')}>
              {formatRatioValue(ratios.assetTurnover, '회', 'turnover')}
            </span>
          </div>
          <div className="ratio-item">
            <span className="ratio-name">자기자본회전율</span>
            <span className={getRatioClass(ratios.equityTurnover, 'turnover')}>
              {formatRatioValue(ratios.equityTurnover, '회', 'turnover')}
            </span>
          </div>
          <div className="ratio-item">
            <span className="ratio-name">매출채권회전율</span>
            <span
              className={getRatioClass(ratios.receivablesTurnover, 'turnover')}
            >
              {formatRatioValue(ratios.receivablesTurnover, '회', 'turnover')}
            </span>
          </div>
        </div>
      </div>

      <div className="ratios-chart-container">
        <Radar data={radarData} options={chartOptions} />
      </div>

      {/* 추가 그래프 섹션 */}
      <div className="additional-charts">
        <div className="profit-margin-chart">
          <h4>📈 수익성 지표 비교</h4>
          <Bar data={profitabilityData} options={barOptions} />
        </div>

        <div className="stability-chart">
          <h4>🛡️ 안정성 지표 비교</h4>
          <Doughnut data={stabilityData} options={doughnutOptions} />
        </div>
      </div>
    </div>
  );
}

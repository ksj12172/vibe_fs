'use client';

import { useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

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
}) {
  const getFilteredFinancialData = () => {
    if (!financialData?.list) return [];

    // 연결재무제표 우선, 없으면 개별재무제표 사용
    const consolidatedData = financialData.list.filter(
      (item) => item.fs_div === 'CFS'
    );

    const individualData = financialData.list.filter(
      (item) => item.fs_div === 'OFS'
    );

    return consolidatedData.length > 0 ? consolidatedData : individualData;
  };

  const formatNumberWithUnit = (value) => {
    if (value >= 1000000000000) {
      return (value / 1000000000000).toFixed(1) + '조원';
    } else if (value >= 100000000) {
      return (value / 100000000).toFixed(1) + '억원';
    } else if (value >= 10000) {
      return (value / 10000).toFixed(1) + '만원';
    } else {
      return new Intl.NumberFormat('ko-KR').format(value) + '원';
    }
  };

  const getChartData = () => {
    const filteredData = getFilteredFinancialData();

    let targetItems = [];
    let chartTitle = '';

    if (chartType === 'bs') {
      // 재무상태표: 자산총계, 부채총계, 자본총계
      targetItems = ['자산총계', '부채총계', '자본총계'];
      chartTitle = '재무상태표 주요 항목';
    } else if (chartType === 'is') {
      // 손익계산서: 매출액, 영업이익, 당기순이익
      targetItems = ['매출액', '영업이익', '당기순이익'];
      chartTitle = '손익계산서 주요 항목';
    }

    // 해당 항목들 찾기
    const chartData = [];
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

    const labels = chartData.map((item) => item.account_nm);
    const currentData = chartData.map((item) => {
      const value = parseInt(item.thstrm_amount?.replace(/,/g, '') || '0');
      return isNaN(value) ? 0 : value / 100000000; // 억원 단위로 변환
    });
    const previousData = chartData.map((item) => {
      const value = parseInt(item.frmtrm_amount?.replace(/,/g, '') || '0');
      return isNaN(value) ? 0 : value / 100000000; // 억원 단위로 변환
    });

    return {
      labels,
      datasets: [
        {
          label: '2024년 (당기)',
          data: currentData,
          backgroundColor: 'rgba(54, 162, 235, 0.8)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1,
        },
        {
          label: '2023년 (전기)',
          data: previousData,
          backgroundColor: 'rgba(255, 99, 132, 0.8)',
          borderColor: 'rgba(255, 99, 132, 1)',
          borderWidth: 1,
        },
      ],
      chartTitle,
    };
  };

  const chartData = getChartData();

  if (!chartData) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
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
        text: `${selectedCompany?.corp_name} - ${chartData.chartTitle} (${currentYear})`,
        font: {
          size: 16,
          weight: 'bold',
        },
      },
      legend: {
        position: 'top',
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            const value = context.parsed.y * 100000000;
            const formattedValue = formatNumberWithUnit(value);
            return context.dataset.label + ': ' + formattedValue;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: '금액 (억원)',
        },
        ticks: {
          callback: function (value) {
            return value.toLocaleString() + '억';
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

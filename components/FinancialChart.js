'use client';

import { useEffect, useRef } from 'react';
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

    // 데이터 필터링
    const chartData = filteredData.filter((item) => {
      if (chartType === 'bs') {
        return item.sj_div === 'BS'; // 재무상태표
      } else if (chartType === 'is') {
        return item.sj_div === 'IS'; // 손익계산서
      }
      return false;
    });

    if (chartData.length === 0) {
      return null;
    }

    // 주요 계정 선택 (상위 10개)
    const topAccounts = chartData
      .filter(
        (item) =>
          item.thstrm_amount &&
          parseInt(item.thstrm_amount.replace(/,/g, '')) > 0
      )
      .sort(
        (a, b) =>
          parseInt(b.thstrm_amount.replace(/,/g, '')) -
          parseInt(a.thstrm_amount.replace(/,/g, ''))
      )
      .slice(0, 10);

    const labels = topAccounts.map((item) => item.account_nm);
    const data = topAccounts.map((item) =>
      parseInt(item.thstrm_amount.replace(/,/g, ''))
    );

    return {
      labels,
      datasets: [
        {
          label: chartType === 'bs' ? '재무상태표 (원)' : '손익계산서 (원)',
          data,
          backgroundColor: [
            '#3498db',
            '#e74c3c',
            '#2ecc71',
            '#f39c12',
            '#9b59b6',
            '#1abc9c',
            '#e67e22',
            '#34495e',
            '#f1c40f',
            '#95a5a6',
          ],
          borderColor: [
            '#2980b9',
            '#c0392b',
            '#27ae60',
            '#d68910',
            '#8e44ad',
            '#16a085',
            '#d35400',
            '#2c3e50',
            '#f1c40f',
            '#7f8c8d',
          ],
          borderWidth: 1,
        },
      ],
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
        text: `${selectedCompany?.corp_name} - ${
          chartType === 'bs' ? '재무상태표' : '손익계산서'
        } (${currentYear})`,
        font: {
          size: 16,
          weight: 'bold',
        },
      },
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            const value = context.parsed.y;
            const formattedValue = formatNumberWithUnit(value);
            return context.dataset.label + ': ' + formattedValue;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function (value) {
            return formatNumberWithUnit(value);
          },
        },
      },
      x: {
        ticks: {
          maxRotation: 45,
          minRotation: 45,
        },
      },
    },
  };

  return <Bar data={chartData} options={options} />;
}

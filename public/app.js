// 전역 변수
let selectedCompany = null;
let financialData = null;
let currentChart = null;
let ratiosChart = null;
let profitMarginChart = null;
let stabilityChart = null;

// DOM 요소
const companySearch = document.getElementById('companySearch');
const searchBtn = document.getElementById('searchBtn');
const searchResults = document.getElementById('searchResults');
const optionsSection = document.getElementById('optionsSection');
const loadingSection = document.getElementById('loadingSection');
const resultsSection = document.getElementById('resultsSection');
const errorSection = document.getElementById('errorSection');
const getDataBtn = document.getElementById('getDataBtn');

// 이벤트 리스너
document.addEventListener('DOMContentLoaded', function () {
  searchBtn.addEventListener('click', searchCompanies);
  companySearch.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
      searchCompanies();
    }
  });

  getDataBtn.addEventListener('click', getFinancialData);

  // 차트 버튼 이벤트
  document.querySelectorAll('.chart-btn').forEach((btn) => {
    btn.addEventListener('click', function () {
      document
        .querySelectorAll('.chart-btn')
        .forEach((b) => b.classList.remove('active'));
      this.classList.add('active');

      const chartType = this.dataset.chart;
      updateChart(chartType);
    });
  });
});

// 회사 검색 함수
async function searchCompanies() {
  const query = companySearch.value.trim();

  if (!query) {
    showError('검색어를 입력해주세요.');
    return;
  }

  try {
    hideAllSections();
    searchResults.innerHTML =
      '<div class="loading-spinner"></div><p>검색 중...</p>';

    const response = await fetch(
      `/api/search-company?query=${encodeURIComponent(query)}`
    );
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || '검색 중 오류가 발생했습니다.');
    }

    displaySearchResults(data.results);
  } catch (error) {
    console.error('검색 오류:', error);
    showError(error.message);
    searchResults.innerHTML = '';
  }
}

// 검색 결과 표시
function displaySearchResults(results) {
  if (results.length === 0) {
    searchResults.innerHTML =
      '<p>검색 결과가 없습니다. 다른 키워드로 검색해보세요.</p>';
    return;
  }

  const html = results
    .map((company) => {
      const isListed = company.stock_code && company.stock_code.trim() !== '';
      const listingTag = isListed
        ? '<span class="company-tag listed">📈 상장</span>'
        : '<span class="company-tag unlisted">📋 비상장</span>';

      const fsTypeTag = isListed
        ? '<span class="fs-preview-tag consolidated">연결재무제표 예상</span>'
        : '<span class="fs-preview-tag individual">개별재무제표 예상</span>';

      return `
        <div class="company-item" onclick="selectCompany('${
          company.corp_code
        }', '${company.corp_name}', '${company.stock_code}')">
            <div class="company-header">
              <h4>${company.corp_name}</h4>
              <div class="company-tags">
                ${listingTag}
                ${fsTypeTag}
              </div>
            </div>
            <div class="company-details">
              <p>회사코드: ${company.corp_code} | 종목코드: ${
        company.stock_code || '없음'
      }</p>
              ${
                company.corp_eng_name
                  ? `<p>영문명: ${company.corp_eng_name}</p>`
                  : ''
              }
            </div>
        </div>
    `;
    })
    .join('');

  searchResults.innerHTML = html;
}

// 회사 선택
function selectCompany(corpCode, corpName, stockCode) {
  selectedCompany = {
    corp_code: corpCode,
    corp_name: corpName,
    stock_code: stockCode,
  };

  // 선택된 회사 정보 표시
  document.getElementById('selectedCompanyName').textContent = corpName;
  document.getElementById('selectedCorpCode').textContent = corpCode;
  document.getElementById('selectedStockCode').textContent =
    stockCode || '없음';

  // 옵션 섹션 표시
  hideAllSections();
  optionsSection.style.display = 'block';
}

// 재무제표 데이터 가져오기
async function getFinancialData() {
  if (!selectedCompany) {
    showError('회사를 먼저 선택해주세요.');
    return;
  }

  const businessYear = document.getElementById('businessYear').value;
  const reportType = document.getElementById('reportType').value;

  try {
    hideAllSections();
    loadingSection.style.display = 'block';

    const response = await fetch(
      `/api/financial-data?corp_code=${selectedCompany.corp_code}&bsns_year=${businessYear}&reprt_code=${reportType}`
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || '데이터 조회 중 오류가 발생했습니다.');
    }

    financialData = data.data;
    displayFinancialData();
  } catch (error) {
    console.error('데이터 조회 오류:', error);
    showError(error.message);
    hideAllSections();
  }
}

// 재무제표 데이터 표시
function displayFinancialData() {
  if (
    !financialData ||
    !financialData.list ||
    financialData.list.length === 0
  ) {
    showError('조회된 데이터가 없습니다.');
    return;
  }

  hideAllSections();
  resultsSection.style.display = 'block';

  // 재무제표 유형 정보 업데이트
  updateFinancialStatementInfo();

  // 기본으로 재무상태표 차트 표시
  updateChart('bs');
  displayDataTable();
}

// 재무제표 유형 정보 업데이트
function updateFinancialStatementInfo() {
  const filteredData = getFilteredFinancialData();
  const fsTypeTag = document.getElementById('fsTypeTag');
  const dataCountInfo = document.getElementById('dataCountInfo');

  if (filteredData.length === 0) {
    fsTypeTag.textContent = '데이터 없음';
    fsTypeTag.className = 'fs-type-tag';
    dataCountInfo.textContent = '';
    return;
  }

  // 연결재무제표 여부 확인
  const isConsolidated = filteredData.some((item) => item.fs_div === 'CFS');
  const consolidatedCount = financialData.list.filter(
    (item) => item.fs_div === 'CFS'
  ).length;
  const individualCount = financialData.list.filter(
    (item) => item.fs_div === 'OFS'
  ).length;

  if (isConsolidated) {
    fsTypeTag.textContent = '🏢 연결재무제표';
    fsTypeTag.className = 'fs-type-tag consolidated';
    dataCountInfo.textContent = `연결 ${consolidatedCount}개, 개별 ${individualCount}개 항목`;
  } else {
    fsTypeTag.textContent = '📋 개별재무제표';
    fsTypeTag.className = 'fs-type-tag individual';
    dataCountInfo.textContent = `개별 ${individualCount}개 항목`;
  }
}

// 차트 업데이트
function updateChart(chartType) {
  if (!financialData || !financialData.list) return;

  // 재무 비율 차트인 경우
  if (chartType === 'ratios') {
    document.getElementById('financialChart').style.display = 'none';
    document.getElementById('financialRatiosSection').style.display = 'block';
    calculateAndDisplayRatios();
    return;
  } else {
    document.getElementById('financialChart').style.display = 'block';
    document.getElementById('financialRatiosSection').style.display = 'none';
  }

  // 기존 차트 제거
  if (currentChart) {
    currentChart.destroy();
  }

  // 중복 제거된 데이터 사용
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
    document.getElementById('financialChart').innerHTML =
      '<p>해당 유형의 데이터가 없습니다.</p>';
    return;
  }

  // 주요 계정 선택 (상위 10개)
  const topAccounts = chartData
    .filter(
      (item) =>
        item.thstrm_amount && parseInt(item.thstrm_amount.replace(/,/g, '')) > 0
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

  // Chart.js로 차트 생성
  const ctx = document.getElementById('financialChart').getContext('2d');
  currentChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        {
          label: chartType === 'bs' ? '재무상태표 (원)' : '손익계산서 (원)',
          data: data,
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
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: `${selectedCompany.corp_name} - ${
            chartType === 'bs' ? '재무상태표' : '손익계산서'
          } (${getCurrentYear()})`,
          font: {
            size: 16,
            weight: 'bold',
          },
        },
        legend: {
          display: false,
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function (value) {
              // 숫자를 억원, 조원 단위로 표시
              if (value >= 1000000000000) {
                return (value / 1000000000000).toFixed(1) + '조원';
              } else if (value >= 100000000) {
                return (value / 100000000).toFixed(1) + '억원';
              } else if (value >= 10000) {
                return (value / 10000).toFixed(1) + '만원';
              } else {
                return new Intl.NumberFormat('ko-KR').format(value) + '원';
              }
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
      plugins: {
        tooltip: {
          callbacks: {
            label: function (context) {
              const value = context.parsed.y;
              let formattedValue;
              if (value >= 1000000000000) {
                formattedValue = (value / 1000000000000).toFixed(1) + '조원';
              } else if (value >= 100000000) {
                formattedValue = (value / 100000000).toFixed(1) + '억원';
              } else if (value >= 10000) {
                formattedValue = (value / 10000).toFixed(1) + '만원';
              } else {
                formattedValue =
                  new Intl.NumberFormat('ko-KR').format(value) + '원';
              }
              return context.dataset.label + ': ' + formattedValue;
            },
          },
        },
      },
    },
  });
}

// 재무 비율 계산 및 표시
function calculateAndDisplayRatios() {
  if (!financialData || !financialData.list) return;

  // 연결재무제표 우선, 없으면 개별재무제표 사용
  const filteredData = getFilteredFinancialData();
  const bsData = filteredData.filter((item) => item.sj_div === 'BS');
  const isData = filteredData.filter((item) => item.sj_div === 'IS');

  // 주요 계정 추출 함수
  function getAccountAmount(data, accountNames) {
    for (const name of accountNames) {
      const account = data.find(
        (item) => item.account_nm && item.account_nm.includes(name)
      );
      if (account && account.thstrm_amount) {
        return parseInt(account.thstrm_amount.replace(/,/g, '')) || 0;
      }
    }
    return 0;
  }

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
  const ratios = {
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

  // 비율 값 표시
  updateRatioValue('roeValue', ratios.roe, '%', 'percentage');
  updateRatioValue('roaValue', ratios.roa, '%', 'percentage');
  updateRatioValue(
    'operatingMarginValue',
    ratios.operatingMargin,
    '%',
    'percentage'
  );
  updateRatioValue(
    'netProfitMarginValue',
    ratios.netProfitMargin,
    '%',
    'percentage'
  );
  updateRatioValue('debtRatioValue', ratios.debtRatio, '%', 'ratio');
  updateRatioValue('equityRatioValue', ratios.equityRatio, '%', 'percentage');
  updateRatioValue(
    'equityDebtRatioValue',
    ratios.equityDebtRatio,
    '%',
    'percentage'
  );
  updateRatioValue('currentRatioValue', ratios.currentRatio, '%', 'ratio');
  updateRatioValue(
    'assetTurnoverValue',
    ratios.assetTurnover,
    '회',
    'turnover'
  );
  updateRatioValue(
    'equityTurnoverValue',
    ratios.equityTurnover,
    '회',
    'turnover'
  );
  updateRatioValue(
    'receivablesTurnoverValue',
    ratios.receivablesTurnover,
    '회',
    'turnover'
  );

  // 차트 생성
  createRatiosChart(ratios);
  createProfitMarginChart(ratios);
  createStabilityChart(ratios);
}

// 연결재무제표 우선 필터링 함수
function getFilteredFinancialData() {
  if (!financialData || !financialData.list) return [];

  // 연결재무제표가 있는지 확인
  const consolidatedData = financialData.list.filter(
    (item) => item.fs_div === 'CFS' // 연결재무제표
  );

  // 개별재무제표 확인
  const individualData = financialData.list.filter(
    (item) => item.fs_div === 'OFS' // 개별재무제표
  );

  // 연결재무제표가 있으면 연결재무제표 사용, 없으면 개별재무제표 사용
  return consolidatedData.length > 0 ? consolidatedData : individualData;
}

// 비율 값 업데이트 및 스타일 적용
function updateRatioValue(elementId, value, unit, type) {
  const element = document.getElementById(elementId);
  if (!element) return;

  if (value === 0 || isNaN(value)) {
    element.textContent = '-';
    element.className = 'ratio-value';
    return;
  }

  const formattedValue =
    type === 'turnover' ? value.toFixed(2) : value.toFixed(1);
  element.textContent = `${formattedValue}${unit}`;

  // 색상 클래스 적용
  element.className = 'ratio-value';

  if (type === 'percentage') {
    if (value > 0) element.classList.add('positive');
    else if (value < 0) element.classList.add('negative');
    else element.classList.add('neutral');
  } else if (type === 'ratio') {
    if (value < 100) element.classList.add('positive');
    else if (value > 200) element.classList.add('negative');
    else element.classList.add('neutral');
  } else if (type === 'turnover') {
    if (value > 1) element.classList.add('positive');
    else if (value < 0.5) element.classList.add('negative');
    else element.classList.add('neutral');
  }
}

// 재무 비율 레이더 차트 생성
function createRatiosChart(ratios) {
  if (ratiosChart) {
    ratiosChart.destroy();
  }

  const ctx = document.getElementById('ratiosChart').getContext('2d');

  // 데이터 정규화 (0-100 스케일)
  const normalizedData = [
    Math.min(Math.max((ratios.roe / 20) * 100, 0), 100), // ROE 20%를 100으로
    Math.min(Math.max((ratios.roa / 10) * 100, 0), 100), // ROA 10%를 100으로
    Math.min(Math.max((ratios.operatingMargin / 20) * 100, 0), 100), // 영업이익률 20%를 100으로
    Math.min(Math.max((ratios.netProfitMargin / 15) * 100, 0), 100), // 순이익률 15%를 100으로
    Math.min(Math.max((200 - ratios.debtRatio) / 2, 0), 100), // 부채비율 낮을수록 좋음
    Math.min(Math.max(ratios.equityRatio, 0), 100), // 자기자본비율
    Math.min(Math.max(ratios.currentRatio / 2, 0), 100), // 유동비율 200%를 100으로
  ];

  ratiosChart = new Chart(ctx, {
    type: 'radar',
    data: {
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
          data: normalizedData,
          backgroundColor: 'rgba(52, 152, 219, 0.2)',
          borderColor: 'rgba(52, 152, 219, 1)',
          borderWidth: 2,
          pointBackgroundColor: 'rgba(52, 152, 219, 1)',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 5,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: `${selectedCompany.corp_name} - 재무 비율 종합 분석`,
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
    },
  });
}

// 수익성 지표 차트 생성
function createProfitMarginChart(ratios) {
  if (profitMarginChart) {
    profitMarginChart.destroy();
  }

  const ctx = document.getElementById('profitMarginChart').getContext('2d');

  profitMarginChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['ROE', 'ROA', '영업이익률', '순이익률'],
      datasets: [
        {
          label: '수익성 지표 (%)',
          data: [
            ratios.roe.toFixed(1),
            ratios.roa.toFixed(1),
            ratios.operatingMargin.toFixed(1),
            ratios.netProfitMargin.toFixed(1),
          ],
          backgroundColor: ['#3498db', '#2ecc71', '#f39c12', '#e74c3c'],
          borderColor: ['#2980b9', '#27ae60', '#d68910', '#c0392b'],
          borderWidth: 1,
        },
      ],
    },
    options: {
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
    },
  });
}

// 안정성 지표 차트 생성
function createStabilityChart(ratios) {
  if (stabilityChart) {
    stabilityChart.destroy();
  }

  const ctx = document.getElementById('stabilityChart').getContext('2d');

  stabilityChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['자기자본', '부채'],
      datasets: [
        {
          data: [
            ratios.equityRatio.toFixed(1),
            (100 - ratios.equityRatio).toFixed(1),
          ],
          backgroundColor: ['#27ae60', '#e74c3c'],
          borderColor: ['#2c3e50', '#2c3e50'],
          borderWidth: 2,
        },
      ],
    },
    options: {
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
    },
  });
}

// 데이터 테이블 표시
function displayDataTable() {
  if (!financialData || !financialData.list) return;

  // 중복 제거된 데이터 사용
  const filteredData = getFilteredFinancialData();

  // 당기/전기 연도 추출
  const currentYear = getCurrentYear();
  const previousYear = getPreviousYear();

  const tableHtml = `
        <table class="data-table">
            <thead>
                <tr>
                    <th>계정명</th>
                    <th>재무제표구분</th>
                    <th>당기금액 (${currentYear})</th>
                    <th>전기금액 (${previousYear})</th>
                    <th>재무제표유형</th>
                </tr>
            </thead>
            <tbody>
                ${filteredData
                  .map(
                    (item) => `
                    <tr>
                        <td>${item.account_nm || '-'}</td>
                        <td>${item.sj_nm || '-'}</td>
                        <td>${
                          item.thstrm_amount
                            ? formatNumberWithUnit(item.thstrm_amount)
                            : '-'
                        }</td>
                        <td>${
                          item.frmtrm_amount
                            ? formatNumberWithUnit(item.frmtrm_amount)
                            : '-'
                        }</td>
                        <td>${getFinancialStatementType(item.fs_div)}</td>
                    </tr>
                `
                  )
                  .join('')}
            </tbody>
        </table>
    `;

  document.getElementById('dataTable').innerHTML = tableHtml;
}

// 당기 연도 추출
function getCurrentYear() {
  const businessYear = document.getElementById('businessYear').value;
  return businessYear;
}

// 전기 연도 추출
function getPreviousYear() {
  const businessYear = document.getElementById('businessYear').value;
  return (parseInt(businessYear) - 1).toString();
}

// 재무제표 유형 표시
function getFinancialStatementType(fsDiv) {
  switch (fsDiv) {
    case 'CFS':
      return '연결재무제표';
    case 'OFS':
      return '개별재무제표';
    default:
      return '기타';
  }
}

// 숫자 포맷팅 (단위 포함)
function formatNumberWithUnit(numberString) {
  if (!numberString) return '-';

  const number = parseInt(numberString.replace(/,/g, ''));

  if (number >= 1000000000000) {
    // 1조 이상
    return `${(number / 1000000000000).toFixed(1)}조원`;
  } else if (number >= 100000000) {
    // 1억 이상
    return `${(number / 100000000).toFixed(1)}억원`;
  } else if (number >= 10000) {
    // 1만 이상
    return `${(number / 10000).toFixed(1)}만원`;
  } else {
    return `${new Intl.NumberFormat('ko-KR').format(number)}원`;
  }
}

// 기존 숫자 포맷팅 (호환성 유지)
function formatNumber(numberString) {
  if (!numberString) return '-';
  return new Intl.NumberFormat('ko-KR').format(
    parseInt(numberString.replace(/,/g, ''))
  );
}

// 오류 표시
function showError(message) {
  hideAllSections();
  document.getElementById('errorMessage').textContent = message;
  errorSection.style.display = 'block';
}

// 모든 섹션 숨기기
function hideAllSections() {
  optionsSection.style.display = 'none';
  loadingSection.style.display = 'none';
  resultsSection.style.display = 'none';
  errorSection.style.display = 'none';
}

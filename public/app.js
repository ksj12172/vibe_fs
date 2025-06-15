// 전역 변수
let selectedCompany = null;
let financialData = null;
let currentChart = null;

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
    .map(
      (company) => `
        <div class="company-item" onclick="selectCompany('${
          company.corp_code
        }', '${company.corp_name}', '${company.stock_code}')">
            <h4>${company.corp_name}</h4>
            <p>회사코드: ${company.corp_code} | 종목코드: ${
        company.stock_code || '없음'
      }</p>
            ${
              company.corp_eng_name
                ? `<p>영문명: ${company.corp_eng_name}</p>`
                : ''
            }
        </div>
    `
    )
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

  // 기본으로 재무상태표 차트 표시
  updateChart('bs');
  displayDataTable();
}

// 차트 업데이트
function updateChart(chartType) {
  if (!financialData || !financialData.list) return;

  // 기존 차트 제거
  if (currentChart) {
    currentChart.destroy();
  }

  // 데이터 필터링
  const filteredData = financialData.list.filter((item) => {
    if (chartType === 'bs') {
      return item.sj_div === 'BS'; // 재무상태표
    } else if (chartType === 'is') {
      return item.sj_div === 'IS'; // 손익계산서
    }
    return false;
  });

  if (filteredData.length === 0) {
    document.getElementById('financialChart').innerHTML =
      '<p>해당 유형의 데이터가 없습니다.</p>';
    return;
  }

  // 주요 계정 선택 (상위 10개)
  const topAccounts = filteredData
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
          }`,
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
              return new Intl.NumberFormat('ko-KR').format(value);
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
    },
  });
}

// 데이터 테이블 표시
function displayDataTable() {
  if (!financialData || !financialData.list) return;

  const tableHtml = `
        <table class="data-table">
            <thead>
                <tr>
                    <th>계정명</th>
                    <th>재무제표구분</th>
                    <th>당기금액</th>
                    <th>전기금액</th>
                    <th>통화단위</th>
                </tr>
            </thead>
            <tbody>
                ${financialData.list
                  .map(
                    (item) => `
                    <tr>
                        <td>${item.account_nm || '-'}</td>
                        <td>${item.sj_nm || '-'}</td>
                        <td>${
                          item.thstrm_amount
                            ? formatNumber(item.thstrm_amount)
                            : '-'
                        }</td>
                        <td>${
                          item.frmtrm_amount
                            ? formatNumber(item.frmtrm_amount)
                            : '-'
                        }</td>
                        <td>${item.currency || 'KRW'}</td>
                    </tr>
                `
                  )
                  .join('')}
            </tbody>
        </table>
    `;

  document.getElementById('dataTable').innerHTML = tableHtml;
}

// 숫자 포맷팅
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

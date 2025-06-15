'use client';

import { useState } from 'react';

export default function FinancialOptions({
  selectedCompany,
  onStartLoading,
  onDataLoaded,
  onError,
  visible,
}) {
  const [businessYear, setBusinessYear] = useState('2024');
  const [reportType, setReportType] = useState('11011');

  const getFinancialData = async () => {
    if (!selectedCompany) {
      onError('회사를 먼저 선택해주세요.');
      return;
    }

    try {
      onStartLoading();

      const response = await fetch(
        `/api/financial-data?corp_code=${selectedCompany.corp_code}&bsns_year=${businessYear}&reprt_code=${reportType}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '데이터 조회 중 오류가 발생했습니다.');
      }

      onDataLoaded(data.data);
    } catch (error) {
      console.error('데이터 조회 오류:', error);
      onError(error.message);
    }
  };

  if (!visible) return null;

  return (
    <section className="options-section">
      <h2>📋 재무제표 옵션</h2>
      <div className="selected-company">
        <h3>{selectedCompany?.corp_name}</h3>
        <p>
          회사코드: <span>{selectedCompany?.corp_code}</span>
        </p>
        <p>
          종목코드: <span>{selectedCompany?.stock_code || '없음'}</span>
        </p>
      </div>

      <div className="options-grid">
        <div className="option-group">
          <label htmlFor="businessYear">사업연도</label>
          <select
            id="businessYear"
            value={businessYear}
            onChange={(e) => setBusinessYear(e.target.value)}
          >
            <option value="2024">2024년</option>
            <option value="2023">2023년</option>
            <option value="2022">2022년</option>
            <option value="2021">2021년</option>
            <option value="2020">2020년</option>
            <option value="2019">2019년</option>
          </select>
        </div>

        <div className="option-group">
          <label htmlFor="reportType">보고서 유형</label>
          <select
            id="reportType"
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
          >
            <option value="11011">사업보고서 (연간)</option>
            <option value="11012">반기보고서</option>
            <option value="11013">1분기보고서</option>
            <option value="11014">3분기보고서</option>
          </select>
        </div>
      </div>

      <button className="get-data-btn" onClick={getFinancialData}>
        재무제표 조회
      </button>
    </section>
  );
}

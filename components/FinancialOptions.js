"use client";

import { useState, useMemo } from "react";

export default function FinancialOptions({
  selectedCompany,
  onStartLoading,
  onDataLoaded,
  onError,
  availableYears,
  availableReports,
  initialValues,
  onYearChange,
}) {
  const [businessYear, setBusinessYear] = useState(initialValues.initialYear);
  const [reportType, setReportType] = useState(initialValues.initialReportType);

  // 연도 변경 핸들러
  const handleYearChange = (newYear) => {
    setBusinessYear(newYear);
    onYearChange(newYear); // 부모 컴포넌트에 연도 변경 알림
  };

  // 선택된 보고서 유형이 사용 가능한 목록에 없으면 첫 번째 옵션으로 변경
  useMemo(() => {
    const isCurrentReportAvailable = availableReports.some(
      (report) => report.value === reportType
    );

    if (!isCurrentReportAvailable && availableReports.length > 0) {
      setReportType(availableReports[0].value);
    }
  }, [availableReports, reportType]);

  const getFinancialData = async () => {
    if (!selectedCompany) {
      onError("회사를 먼저 선택해주세요.");
      return;
    }

    if (!reportType) {
      onError("선택할 수 있는 보고서가 없습니다.");
      return;
    }

    try {
      onStartLoading();

      const response = await fetch(
        `/api/financial-data?corp_code=${selectedCompany.corp_code}&bsns_year=${businessYear}&reprt_code=${reportType}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "데이터 조회 중 오류가 발생했습니다.");
      }

      onDataLoaded(data.data);
    } catch (error) {
      console.error("데이터 조회 오류:", error);
      onError(error.message);
    }
  };

  return (
    <section className="options-section">
      <div className="options-grid">
        <div className="option-group">
          <label htmlFor="businessYear">사업연도</label>
          <select
            id="businessYear"
            value={businessYear}
            onChange={(e) => handleYearChange(e.target.value)}
          >
            {availableYears.map((year) => (
              <option key={year} value={year.toString()}>
                {year}년
              </option>
            ))}
          </select>
        </div>

        <div className="option-group">
          <label htmlFor="reportType">보고서 유형</label>
          <select
            id="reportType"
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
          >
            {availableReports.map((report) => (
              <option key={report.value} value={report.value}>
                {report.label}
              </option>
            ))}
          </select>
          <div className="report-info">
            <small>
              💡{" "}
              {parseInt(businessYear) === new Date().getFullYear()
                ? "현재 연도 기준으로 공시 가능한 보고서만 표시됩니다"
                : "선택된 연도의 모든 보고서가 표시됩니다"}
            </small>
          </div>
        </div>
      </div>

      <button
        className="get-data-btn"
        onClick={getFinancialData}
        disabled={!reportType}
      >
        재무제표 조회
      </button>
    </section>
  );
}

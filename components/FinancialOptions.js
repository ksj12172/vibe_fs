"use client";

import { useState, useMemo } from "react";

export default function FinancialOptions({
  selectedCompany,
  onStartLoading,
  onDataLoaded,
  onError,
  autoLoad,
}) {
  const [businessYear, setBusinessYear] = useState("2024");
  const [reportType, setReportType] = useState("11011");

  // 현재 날짜 기준으로 사용 가능한 연도 생성
  const availableYears = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const years = [];

    // 2019년부터 현재 연도까지
    for (let year = currentYear; year >= 2019; year--) {
      years.push(year);
    }

    return years;
  }, []);

  // 선택된 연도에 따른 사용 가능한 보고서 유형 결정
  const availableReports = useMemo(() => {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1; // 0-based이므로 +1
    const selectedYearNum = parseInt(businessYear);

    const reports = [];

    if (selectedYearNum < currentYear) {
      // 과거 연도
      if (selectedYearNum < currentYear - 1) {
        // 2년 이전: 모든 보고서 사용 가능 (충분한 시간이 지남)
        reports.push(
          { value: "11013", label: "1분기보고서" },
          { value: "11012", label: "반기보고서" },
          { value: "11014", label: "3분기보고서" },
          { value: "11011", label: "사업보고서 (연간)" }
        );
      } else {
        // 작년 (currentYear - 1)

        // 작년의 분기별 보고서들은 이미 모두 공시됨
        reports.push(
          { value: "11013", label: "1분기보고서" },
          { value: "11012", label: "반기보고서" },
          { value: "11014", label: "3분기보고서" }
        );

        // 작년 사업보고서는 올해 3-4월경 공시됨
        if (currentMonth >= 4) {
          reports.push({ value: "11011", label: "사업보고서 (연간)" });
        }
      }
    } else if (selectedYearNum === currentYear) {
      // 현재 연도: 올해 사업보고서는 내년에 공시되므로 제외

      // 1분기보고서: 5월경 공시
      if (currentMonth >= 5) {
        reports.push({ value: "11013", label: "1분기보고서" });
      }

      // 반기보고서: 8월경 공시
      if (currentMonth >= 8) {
        reports.push({ value: "11012", label: "반기보고서" });
      }

      // 3분기보고서: 11월경 공시
      if (currentMonth >= 11) {
        reports.push({ value: "11014", label: "3분기보고서" });
      }

      // 아무 보고서도 없으면 안내 메시지 표시
      if (reports.length === 0) {
        reports.push({
          value: "",
          label: "선택할 수 있는 보고서가 없습니다",
        });
      }
    } else {
      // 미래 연도
      reports.push({
        value: "",
        label: "선택할 수 있는 보고서가 없습니다",
      });
    }

    return reports;
  }, [businessYear]);

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
            onChange={(e) => setBusinessYear(e.target.value)}
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

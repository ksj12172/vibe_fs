"use client";

import { useState, useEffect } from "react";
import FinancialChart from "./FinancialChart";
import FinancialRatios from "./FinancialRatios.tsx";

export default function FinancialResults({ selectedCompany, financialData }) {
  const [currentChart, setCurrentChart] = useState("bs");
  const [filteredData, setFilteredData] = useState([]);
  const [fsTypeInfo, setFsTypeInfo] = useState({ type: "", count: "" });

  useEffect(() => {
    if (financialData?.list) {
      updateFinancialStatementInfo();
    }
  }, [financialData]);

  const getFilteredFinancialData = () => {
    if (!financialData?.list) return [];

    // 연결재무제표가 있는지 확인
    const consolidatedData = financialData.list.filter(
      (item) => item.fs_div === "CFS" // 연결재무제표
    );

    // 개별재무제표 확인
    const individualData = financialData.list.filter(
      (item) => item.fs_div === "OFS" // 개별재무제표
    );

    // 연결재무제표가 있으면 연결재무제표 사용, 없으면 개별재무제표 사용
    return consolidatedData.length > 0 ? consolidatedData : individualData;
  };

  const updateFinancialStatementInfo = () => {
    const filtered = getFilteredFinancialData();
    const consolidatedCount = financialData.list.filter(
      (item) => item.fs_div === "CFS"
    ).length;
    const individualCount = financialData.list.filter(
      (item) => item.fs_div === "OFS"
    ).length;

    if (filtered.length === 0) {
      setFsTypeInfo({ type: "데이터 없음", count: "" });
      return;
    }

    // 연결재무제표 여부 확인
    const isConsolidated = filtered.some((item) => item.fs_div === "CFS");

    if (isConsolidated) {
      setFsTypeInfo({
        type: "🏢 연결재무제표",
        count: `연결 ${consolidatedCount}개, 개별 ${individualCount}개 항목`,
      });
    } else {
      setFsTypeInfo({
        type: "📋 개별재무제표",
        count: `개별 ${individualCount}개 항목`,
      });
    }
  };

  const formatNumberWithUnit = (numberString) => {
    if (!numberString) return "-";

    const number = parseInt(numberString.replace(/,/g, ""));

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
      return `${new Intl.NumberFormat("ko-KR").format(number)}원`;
    }
  };

  const getCurrentYear = () => {
    // 선택된 년도를 가져오는 로직 (일단 2024로 고정)
    return "2024";
  };

  const getPreviousYear = () => {
    return (parseInt(getCurrentYear()) - 1).toString();
  };

  const getFinancialStatementType = (fsDiv) => {
    switch (fsDiv) {
      case "CFS":
        return "연결재무제표";
      case "OFS":
        return "개별재무제표";
      default:
        return "기타";
    }
  };

  const renderDataTable = () => {
    const filtered = getFilteredFinancialData();
    const currentYear = getCurrentYear();
    const previousYear = getPreviousYear();

    return (
      <div className="data-table-container">
        <h3>📊 상세 데이터</h3>
        <table className="data-table">
          <thead>
            <tr>
              <th>계정명</th>
              <th>재무제표구분</th>
              <th>당기금액 ({currentYear})</th>
              <th>전기금액 ({previousYear})</th>
              <th>재무제표유형</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((item, index) => (
              <tr key={index}>
                <td>{item.account_nm || "-"}</td>
                <td>{item.sj_nm || "-"}</td>
                <td>{formatNumberWithUnit(item.thstrm_amount)}</td>
                <td>{formatNumberWithUnit(item.frmtrm_amount)}</td>
                <td>{getFinancialStatementType(item.fs_div)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <section className="results-section">
      <div className="results-header">
        <h2>📈 재무제표 시각화</h2>
        <div className="financial-statement-info">
          <span
            className={`fs-type-tag ${
              fsTypeInfo.type.includes("연결") ? "consolidated" : "individual"
            }`}
          >
            {fsTypeInfo.type}
          </span>
          <span className="data-count-info">{fsTypeInfo.count}</span>
        </div>
      </div>

      <div className="chart-controls">
        <button
          className={`chart-btn ${currentChart === "bs" ? "active" : ""}`}
          onClick={() => setCurrentChart("bs")}
        >
          재무상태표
        </button>
        <button
          className={`chart-btn ${currentChart === "is" ? "active" : ""}`}
          onClick={() => setCurrentChart("is")}
        >
          손익계산서
        </button>
        <button
          className={`chart-btn ${currentChart === "ratios" ? "active" : ""}`}
          onClick={() => setCurrentChart("ratios")}
        >
          재무비율
        </button>
      </div>

      <div className="chart-container">
        {currentChart === "ratios" ? (
          <FinancialRatios
            selectedCompany={selectedCompany}
            financialData={financialData}
          />
        ) : (
          <div style={{ height: "500px" }}>
            <FinancialChart
              selectedCompany={selectedCompany}
              financialData={financialData}
              chartType={currentChart}
              currentYear={getCurrentYear()}
            />
          </div>
        )}
      </div>

      {renderDataTable()}
    </section>
  );
}

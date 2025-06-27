"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import FinancialOptions from "../../../components/FinancialOptions";
import LoadingSection from "../../../components/LoadingSection";
import FinancialResults from "../../../components/FinancialResults";
import ErrorSection from "../../../components/ErrorSection";

export default function CompanyPage() {
  const params = useParams();
  const router = useRouter();
  const stockCode = params.code;

  const [company, setCompany] = useState(null);
  const [financialData, setFinancialData] = useState(null);
  const [currentStep, setCurrentStep] = useState("loading"); // loading, options, data-loading, results, error
  const [errorMessage, setErrorMessage] = useState("");

  // 페이지 로드 시 회사 정보 조회
  useEffect(() => {
    if (stockCode) {
      fetchCompanyInfo(stockCode);
    }
  }, [stockCode]);

  const fetchCompanyInfo = async (code) => {
    try {
      setCurrentStep("loading");

      const response = await fetch(`/api/company-by-code?stock_code=${code}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "회사 정보를 조회할 수 없습니다.");
      }

      setCompany(data.company);
      setCurrentStep("options");
    } catch (error) {
      console.error("회사 정보 조회 오류:", error);
      setErrorMessage(error.message);
      setCurrentStep("error");
    }
  };

  const handleStartLoading = () => {
    setCurrentStep("data-loading");
  };

  const handleDataLoaded = (data) => {
    setFinancialData(data);
    setCurrentStep("results");
  };

  const handleError = (message) => {
    setErrorMessage(message);
    setCurrentStep("error");
  };

  const resetToOptions = () => {
    setFinancialData(null);
    setCurrentStep("options");
    setErrorMessage("");
  };

  const goToHome = () => {
    router.push("/");
  };

  return (
    <div className="container">
      <div className="page-header">
        <h1>재무제표 분석</h1>
        <p>
          종목코드: <strong>{stockCode}</strong>
        </p>
      </div>

      <main>
        {/* 로딩 상태 - 회사 정보 조회 중 */}
        {currentStep === "loading" && (
          <div className="loading-company">
            <h2>🔍 회사 정보 조회 중...</h2>
            <p>종목코드 {stockCode}에 해당하는 회사를 찾고 있습니다.</p>
          </div>
        )}

        {/* 재무제표 옵션 선택 */}
        {(currentStep === "options" ||
          currentStep === "data-loading" ||
          currentStep === "results") &&
          company && (
            <FinancialOptions
              selectedCompany={company}
              onStartLoading={handleStartLoading}
              onDataLoaded={handleDataLoaded}
              onError={handleError}
              visible={currentStep === "options"}
            />
          )}

        {/* 재무데이터 로딩 상태 */}
        {currentStep === "data-loading" && <LoadingSection />}

        {/* 결과 및 시각화 */}
        {currentStep === "results" && company && financialData && (
          <FinancialResults
            selectedCompany={company}
            financialData={financialData}
          />
        )}

        {/* 오류 메시지 */}
        {currentStep === "error" && (
          <ErrorSection
            message={errorMessage}
            onReset={company ? resetToOptions : goToHome}
          />
        )}
      </main>
    </div>
  );
}

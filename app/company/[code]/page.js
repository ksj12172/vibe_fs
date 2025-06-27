"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import FinancialOptions from "../../../components/FinancialOptions";
import LoadingSection from "../../../components/LoadingSection";
import FinancialResults from "../../../components/FinancialResults";
import ErrorSection from "../../../components/ErrorSection";

export default function CompanyPage() {
  const params = useParams();
  const router = useRouter();
  const stockCode = params.code;
  const currentYear = new Date().getFullYear();

  const [company, setCompany] = useState(null);
  const [financialData, setFinancialData] = useState(null);
  const [currentStep, setCurrentStep] = useState("loading"); // loading, ready, data-loading, results, error
  const [errorMessage, setErrorMessage] = useState("");

  // 현재 날짜 기준으로 사용 가능한 연도 생성
  const availableYears = useMemo(() => {
    const years = [];

    // 2019년부터 현재 연도까지
    for (let year = currentYear; year >= 2019; year--) {
      years.push(year);
    }

    return years;
  }, []);

  // 선택된 연도에 따른 사용 가능한 보고서 유형 결정 함수
  const getAvailableReports = (businessYear) => {
    const currentDate = new Date();
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
  };

  // 초기 연도 결정
  const initialYear = currentYear.toString();

  // 선택된 연도 상태
  const [selectedYear, setSelectedYear] = useState(initialYear);

  // 선택된 연도에 따른 사용 가능한 보고서 목록
  const availableReports = useMemo(() => {
    return getAvailableReports(selectedYear);
  }, [selectedYear]);

  // 초기 보고서 유형 결정
  const initialReportType = useMemo(() => {
    return availableReports.length > 0 && availableReports[0].value
      ? availableReports[0].value
      : "";
  }, [availableReports]);

  // 초기값 객체
  const initialValues = useMemo(
    () => ({
      initialYear,
      initialReportType,
    }),
    [initialYear, initialReportType]
  );

  // 페이지 로드 시 회사 정보 조회 후 자동으로 재무데이터 로드
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
      setCurrentStep("ready");

      // 회사 정보 로드 완료 후 자동으로 재무데이터 로드
      setTimeout(() => {
        autoLoadFinancialData(data.company);
      }, 100);
    } catch (error) {
      console.error("회사 정보 조회 오류:", error);
      setErrorMessage(error.message);
      setCurrentStep("error");
    }
  };

  // 자동으로 최신 재무데이터 로드
  const autoLoadFinancialData = async (companyData) => {
    try {
      if (!initialReportType) {
        // 자동 로드할 데이터가 없으면 옵션 선택 상태로 유지
        console.log(
          "자동 로드 가능한 보고서가 없습니다. 사용자가 직접 선택할 수 있도록 대기합니다."
        );
        setCurrentStep("ready");
        return;
      }

      setCurrentStep("data-loading");

      const response = await fetch(
        `/api/financial-data?corp_code=${companyData.corp_code}&bsns_year=${initialYear}&reprt_code=${initialReportType}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "데이터 조회 중 오류가 발생했습니다.");
      }

      setFinancialData(data.data);
      setCurrentStep("results");
    } catch (error) {
      console.error("자동 데이터 로드 오류:", error);
      // 자동 로드 실패 시에도 옵션 선택은 가능하도록 ready 상태 유지
      setCurrentStep("ready");
      // 에러 메시지는 표시하지만 페이지 전체를 에러 상태로 만들지 않음
      console.warn(
        "자동 데이터 로드에 실패했지만, 사용자가 수동으로 선택할 수 있습니다:",
        error.message
      );
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
    setCurrentStep("ready");
    setErrorMessage("");
  };

  const goToHome = () => {
    router.push("/");
  };

  return (
    <div className="container">
      <div className="page-header">
        <h1>재무제표 분석</h1>
        {company && (
          <div className="company-info">
            <h2 className="company-name">{company.corp_name}</h2>
            <p className="company-code">
              회사코드: <strong>{company.corp_code}</strong>
            </p>
            <p className="stock-code">
              종목코드: <strong>{stockCode}</strong>
            </p>
          </div>
        )}
        {!company && currentStep === "loading" && (
          <p className="loading-text">
            종목코드: <strong>{stockCode}</strong>
          </p>
        )}
      </div>

      <main>
        {/* 로딩 상태 - 회사 정보 조회 중 */}
        {currentStep === "loading" && (
          <div className="loading-company">
            <h2>🔍 회사 정보 조회 중...</h2>
            <p>종목코드 {stockCode}에 해당하는 회사를 찾고 있습니다.</p>
          </div>
        )}

        {/* 재무제표 옵션 선택 - 항상 노출 */}
        {(currentStep === "ready" ||
          currentStep === "data-loading" ||
          currentStep === "results") &&
          company && (
            <FinancialOptions
              selectedCompany={company}
              onStartLoading={handleStartLoading}
              onDataLoaded={handleDataLoaded}
              onError={handleError}
              availableYears={availableYears}
              availableReports={availableReports}
              initialValues={initialValues}
              onYearChange={setSelectedYear}
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

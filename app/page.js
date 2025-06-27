"use client";

import { useState } from "react";
import CompanySearch from "../components/CompanySearch";
import ErrorSection from "../components/ErrorSection";

export default function HomePage() {
  const [errorMessage, setErrorMessage] = useState("");

  const handleError = (message) => {
    setErrorMessage(message);
  };

  const resetError = () => {
    setErrorMessage("");
  };

  return (
    <div className="container">
      <header>
        <h1>📊 재무제표 시각화</h1>
        <p>한국 상장기업의 재무제표를 쉽게 조회하고 시각화해보세요</p>
        <p>회사를 검색한 후 클릭하여 재무제표를 확인하세요</p>
      </header>

      <main>
        {/* 회사 검색 */}
        <CompanySearch onError={handleError} />

        {/* 오류 메시지 */}
        {errorMessage && (
          <ErrorSection message={errorMessage} onReset={resetError} />
        )}
      </main>
    </div>
  );
}

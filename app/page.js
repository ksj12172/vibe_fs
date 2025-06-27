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
      <div className="page-header">
        <h1>회사 검색</h1>
        <p>재무제표를 확인하고 싶은 회사를 검색해보세요</p>
      </div>

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

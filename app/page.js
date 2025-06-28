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

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import StockSearch from "../components/StockSearch";
import ErrorSection from "../components/ErrorSection";

const ETF_TICKER_LIST = [
  { name: "TIGER 200", stockCode: "102110" },
  { name: "TIGER 차이나항셍테크", stockCode: "371160" },
];

export default function HomePage() {
  const [errorMessage, setErrorMessage] = useState("");
  const router = useRouter();

  const handleError = (message) => {
    setErrorMessage(message);
  };

  const resetError = () => {
    setErrorMessage("");
  };

  const handleETFClick = (etfCode) => {
    // ETF 차트 페이지로 이동 (기본 period: 3mo)
    router.push(`/chart/${etfCode}?period=3mo`);
  };

  return (
    <div className="container">
      <main>
        {/* ETF 차트 바로가기 */}
        <section
          className="etf-quick-access"
          style={{
            marginTop: "2rem",
            padding: "1.5rem",
            backgroundColor: "#f8f9fa",
            borderRadius: "8px",
            border: "1px solid #e9ecef",
          }}
        >
          <h3
            style={{
              marginBottom: "1rem",
              color: "#495057",
              fontSize: "1.2rem",
              fontWeight: "500",
            }}
          >
            📈 ETF 차트 바로가기
          </h3>
          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
            {ETF_TICKER_LIST.map((item) => (
              <button
                onClick={() => handleETFClick(item.stockCode)}
                style={{
                  padding: "0.75rem 1.5rem",
                  backgroundColor: "#007bff",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "0.9rem",
                  fontWeight: "500",
                  transition: "all 0.2s ease",
                  boxShadow: "0 2px 4px rgba(0,123,255,0.2)",
                }}
                onMouseOver={(e) => {
                  e.target.style.backgroundColor = "#0056b3";
                  e.target.style.transform = "translateY(-1px)";
                  e.target.style.boxShadow = "0 4px 8px rgba(0,123,255,0.3)";
                }}
                onMouseOut={(e) => {
                  e.target.style.backgroundColor = "#007bff";
                  e.target.style.transform = "translateY(0)";
                  e.target.style.boxShadow = "0 2px 4px rgba(0,123,255,0.2)";
                }}
              >
                {item.name}
              </button>
            ))}
          </div>
        </section>

        {/* 주식 검색 */}
        <StockSearch onError={handleError} />

        {/* 오류 메시지 */}
        {errorMessage && (
          <ErrorSection message={errorMessage} onReset={resetError} />
        )}
      </main>
    </div>
  );
}

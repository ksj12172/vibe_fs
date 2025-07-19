"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function StockSearch({ onError }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedMarket, setSelectedMarket] = useState(""); // "", "KR", "US"

  const searchStocks = async () => {
    if (!query.trim()) {
      onError("검색어를 입력해주세요.");
      return;
    }

    try {
      setIsSearching(true);
      setSearchResults([]);

      const marketParam = selectedMarket ? `&market=${selectedMarket}` : "";
      const response = await fetch(
        `/api/search-stock?query=${encodeURIComponent(query)}${marketParam}`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "검색 중 오류가 발생했습니다.");
      }

      setSearchResults(data.results || []);
    } catch (error) {
      console.error("주식 검색 오류:", error);
      onError(error.message);
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      searchStocks();
    }
  };

  const goToFinancialStatementAnalysis = (stock) => {
    // 종목코드로 회사 페이지로 이동
    router.push(`/company/${stock.symbol}`);
  };

  const handleSearchTicker = async (symbol) => {
    router.push(`/chart/${symbol}?period=3mo`);
  };

  const getMarketBadge = (market, exchange) => {
    if (market === "KR") {
      return (
        <span className="company-tag listed">🇰🇷 {exchange || "한국"}</span>
      );
    } else if (market === "US") {
      return (
        <span className="company-tag listed">🇺🇸 {exchange || "미국"}</span>
      );
    }
    return <span className="company-tag listed">📈 {market}</span>;
  };

  const getDisplayName = (stock) => {
    if (stock.market === "KR") {
      return stock.name || stock.nameKor;
    } else if (stock.market === "US") {
      return stock.nameKor || stock.name;
    }
    return stock.name;
  };

  const getSubName = (stock) => {
    if (stock.market === "KR" && stock.nameEng) {
      return stock.nameEng;
    } else if (stock.market === "US" && stock.name !== stock.nameKor) {
      return stock.name;
    }
    return null;
  };

  const renderSearchResults = () => {
    if (isSearching) {
      return (
        <div className="search-results">
          <div className="loading-spinner"></div>
          <p>검색 중...</p>
        </div>
      );
    }

    if (searchResults.length === 0 && query) {
      return (
        <div className="search-results">
          <p>검색 결과가 없습니다. 다른 키워드로 검색해보세요.</p>
        </div>
      );
    }

    return (
      <div className="search-results">
        {searchResults.map((stock) => {
          const displayName = getDisplayName(stock);
          const subName = getSubName(stock);

          return (
            <div key={stock.id} className="company-item">
              <div className="company-header">
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {stock.logo && (
                    <Image
                      src={stock.logo}
                      alt={displayName + " 로고"}
                      width={40}
                      height={40}
                      style={{
                        width: "30px",
                        height: "30px",
                        marginRight: "8px",
                        borderRadius: "50%",
                        objectFit: "contain",
                      }}
                    />
                  )}
                  <div>
                    <h4>{displayName}</h4>
                    {subName && (
                      <p style={{ fontSize: "12px", color: "#666", margin: 0 }}>
                        {subName}
                      </p>
                    )}
                  </div>
                </div>
                <div className="company-tags">
                  {getMarketBadge(stock.market, stock.exchange)}
                  {stock.currency && (
                    <span className="fs-preview-tag individual">
                      {stock.currency}
                    </span>
                  )}
                </div>
              </div>
              <div className="company-details">
                <p>
                  종목코드: {stock.symbol}
                  {stock.sector && ` | 섹터: ${stock.sector}`}
                </p>
                {stock.industry && <p>업종: {stock.industry}</p>}
                <div className="company-tags">
                  <button
                    className="fs-preview-tag consolidated"
                    style={{
                      marginTop: "8px",
                      fontSize: "12px",
                      color: "#007bff",
                      cursor: "pointer",
                    }}
                    onClick={() => goToFinancialStatementAnalysis(stock)}
                  >
                    📃 재무제표 보기
                  </button>
                  <button
                    className="fs-preview-tag consolidated"
                    style={{
                      marginTop: "8px",
                      fontSize: "12px",
                      color: "#007bff",
                      cursor: "pointer",
                    }}
                    onClick={() => handleSearchTicker(stock.symbol)}
                  >
                    📈 주가 변화 보기
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <section className="search-section">
      <h2 style={{ marginBottom: "1rem" }}>🔍 주식 검색</h2>
      <div className="guide" style={{ marginBottom: "1rem" }}>
        재무제표, 주가를 확인하고 싶은 주식을 검색해보세요
      </div>

      {/* 마켓 필터 */}
      <div style={{ marginBottom: "1rem" }}>
        <label style={{ fontSize: "14px", marginRight: "10px" }}>마켓:</label>
        <select
          value={selectedMarket}
          onChange={(e) => setSelectedMarket(e.target.value)}
          style={{
            padding: "5px 10px",
            marginRight: "10px",
            border: "1px solid #ddd",
            borderRadius: "4px",
          }}
        >
          <option value="">전체</option>
          <option value="KR">🇰🇷 한국</option>
          <option value="US">🇺🇸 미국</option>
        </select>
      </div>

      <div className="search-box">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="주식명을 입력하세요 (예: 삼성전자, Apple, Tiger 코스피200)"
          disabled={isSearching}
        />
        <button onClick={searchStocks} disabled={isSearching}>
          {isSearching ? "검색 중..." : "검색"}
        </button>
      </div>
      {renderSearchResults()}
    </section>
  );
}

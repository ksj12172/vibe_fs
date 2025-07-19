"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { useStockStore } from "../lib/stockStore";

export default function StockSearch({ onError }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // URL에서 쿼리 파라미터 읽기
  const urlQuery = searchParams.get("q") || "";
  const urlMarket = searchParams.get("market") || "";

  const [query, setQuery] = useState(urlQuery);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSearchComplete, setIsSearchComplete] = useState(false);
  const [selectedMarket, setSelectedMarket] = useState(urlMarket); // "", "KR", "US"

  // Zustand store 사용
  const { setSelectedStock } = useStockStore();

  // URL 파라미터 변경 시 자동 검색
  useEffect(() => {
    const urlQuery = searchParams.get("q") || "";
    const urlMarket = searchParams.get("market") || "";

    // URL에 검색어가 있으면 자동으로 검색 실행
    if (urlQuery.trim()) {
      performSearch(urlQuery, urlMarket);
    } else {
      // 검색어가 없으면 결과 초기화
      setSearchResults([]);
    }
  }, [searchParams]);

  const performSearch = useCallback(
    async (searchQuery, searchMarket) => {
      if (!searchQuery.trim()) {
        return;
      }

      try {
        setIsSearching(true);
        setIsSearchComplete(false);
        setSearchResults([]);

        const marketParam = searchMarket ? `&market=${searchMarket}` : "";
        const response = await fetch(
          `/api/search-stock?query=${encodeURIComponent(
            searchQuery
          )}${marketParam}`
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
        setIsSearchComplete(true);
      }
    },
    [onError]
  );

  const searchStocks = async () => {
    if (!query.trim()) {
      onError("검색어를 입력해주세요.");
      return;
    }

    // URL 업데이트 (이후 useEffect에서 자동으로 검색 실행됨)
    updateURL(query, selectedMarket);
  };

  const updateURL = (searchQuery, searchMarket) => {
    const params = new URLSearchParams();
    if (searchQuery.trim()) {
      params.set("q", searchQuery.trim());
    }
    if (searchMarket) {
      params.set("market", searchMarket);
    }

    // 히스토리에 추가 (뒤로가기 가능)
    const newUrl = params.toString() ? `/?${params.toString()}` : "/";
    router.push(newUrl);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      searchStocks();
    }
  };

  const goToFinancialStatementAnalysis = (stock) => {
    // Zustand store에 주식 정보 저장
    setSelectedStock({
      id: stock.id,
      symbol: stock.symbol,
      name: stock.name,
      nameKor: stock.nameKor,
      nameEng: stock.nameEng,
      type: stock.type,
      market: stock.market,
      exchange: stock.exchange,
      sector: stock.sector,
      industry: stock.industry,
      description: stock.description,
      logo: stock.logo,
      website: stock.website,
      currency: stock.currency,
      isActive: stock.isActive,
      createdAt: stock.createdAt || new Date().toISOString(),
      updatedAt: stock.updatedAt || new Date().toISOString(),
    });

    // 종목코드로 회사 페이지로 이동
    router.push(`/company/${stock.symbol}`);
  };

  const handleSearchTicker = async (stock) => {
    // Zustand store에 주식 정보 저장
    setSelectedStock({
      id: stock.id,
      symbol: stock.symbol,
      name: stock.name,
      nameKor: stock.nameKor,
      nameEng: stock.nameEng,
      type: stock.type,
      market: stock.market,
      exchange: stock.exchange,
      sector: stock.sector,
      industry: stock.industry,
      description: stock.description,
      logo: stock.logo,
      website: stock.website,
      currency: stock.currency,
      isActive: stock.isActive,
      createdAt: stock.createdAt || new Date().toISOString(),
      updatedAt: stock.updatedAt || new Date().toISOString(),
    });

    router.push(`/chart/${stock.symbol}?period=3mo`);
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

  const getTypeBadge = (type) => {
    switch (type) {
      case "ETF":
        return <span className="fs-preview-tag consolidated">📊 ETF</span>;
      case "ETN":
        return <span className="fs-preview-tag consolidated">📈 ETN</span>;
      case "PREFERRED":
        return <span className="fs-preview-tag individual">💎 우선주</span>;
      case "STOCK":
      default:
        return <span className="fs-preview-tag individual">📃 일반주</span>;
    }
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

  // 재무제표 버튼 표시 조건: ETF/ETN이 아니고 한국 주식인 경우
  const shouldShowFinancialStatement = (stock) => {
    return (
      stock.market === "KR" &&
      (stock.type === "STOCK" || stock.type === "PREFERRED")
    );
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

    if (isSearchComplete && searchResults.length === 0 && query) {
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
                  {getTypeBadge(stock.type)}
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
                  {shouldShowFinancialStatement(stock) && (
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
                  )}
                  <button
                    className="fs-preview-tag consolidated"
                    style={{
                      marginTop: "8px",
                      fontSize: "12px",
                      color: "#007bff",
                      cursor: "pointer",
                    }}
                    onClick={() => handleSearchTicker(stock)}
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
        주식, ETF, ETN, 우선주를 검색해보세요
      </div>

      {/* 마켓 필터 */}
      <div style={{ marginBottom: "1rem" }}>
        <label style={{ fontSize: "14px", marginRight: "10px" }}>마켓:</label>
        <select
          value={selectedMarket}
          onChange={(e) => {
            const newMarket = e.target.value;
            setSelectedMarket(newMarket);
            // 마켓 변경 시 URL 즉시 업데이트
            if (query.trim()) {
              updateURL(query, newMarket);
            }
          }}
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
          placeholder="종목명을 입력하세요 (예: 삼성전자, TIGER 200, 애플)"
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

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function CompanySearch({ onError }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const searchCompanies = async () => {
    if (!query.trim()) {
      onError("검색어를 입력해주세요.");
      return;
    }

    try {
      setIsSearching(true);
      setSearchResults([]);

      const response = await fetch(
        `/api/search-company?query=${encodeURIComponent(query)}`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "검색 중 오류가 발생했습니다.");
      }

      setSearchResults(data.results || []);
    } catch (error) {
      console.error("검색 오류:", error);
      onError(error.message);
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      searchCompanies();
    }
  };

  const handleSearchCompany = (company) => {
    const isListed = company.stock_code && company.stock_code.trim() !== "";

    if (!isListed) {
      return;
    }

    // 상장된 회사면 회사 페이지로 이동
    router.push(`/company/${company.stock_code}`);
  };

  const handleSearchTicker = async (stock_code) => {
    router.push(`/chart/${stock_code}?period=3mo`);
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
        {searchResults.map((company) => {
          const isListed =
            company.stock_code && company.stock_code.trim() !== "";

          return (
            <div
              key={company.corp_code}
              className="company-item"
              style={{
                opacity: isListed ? 1 : 0.7,
              }}
            >
              <div className="company-header">
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {company.logo && (
                    <Image
                      src={company.logo}
                      alt={company.corp_name + " 로고"}
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
                  <h4>{company.corp_name}</h4>
                </div>
                <div className="company-tags">
                  {isListed ? (
                    <span className="company-tag listed">📈 상장</span>
                  ) : (
                    <span className="company-tag unlisted">📋 비상장</span>
                  )}
                  {isListed ? (
                    <span className="fs-preview-tag consolidated">
                      연결재무제표 예상
                    </span>
                  ) : (
                    <span className="fs-preview-tag individual">
                      개별재무제표 예상
                    </span>
                  )}
                </div>
              </div>
              <div className="company-details">
                <p>
                  회사코드: {company.corp_code} | 종목코드:{" "}
                  {company.stock_code || "없음"}
                </p>
                {company.corp_eng_name && (
                  <p>영문명: {company.corp_eng_name}</p>
                )}
                {isListed && (
                  <div className="company-tags">
                    <button
                      className="fs-preview-tag consolidated"
                      style={{
                        marginTop: "8px",
                        fontSize: "12px",
                        color: "#007bff",
                        cursor: "pointer",
                      }}
                      onClick={() => handleSearchCompany(company)}
                    >
                      📃 재무제표 보기
                    </button>
                    {company.stock_code && (
                      <button
                        className="fs-preview-tag consolidated"
                        style={{
                          marginTop: "8px",
                          fontSize: "12px",
                          color: "#007bff",
                          cursor: "pointer",
                        }}
                        onClick={() => handleSearchTicker(company.stock_code)}
                      >
                        📈 주가 변화 보기
                      </button>
                    )}
                  </div>
                )}
                {!isListed && (
                  <p
                    style={{
                      marginTop: "8px",
                      fontSize: "12px",
                      color: "#999",
                    }}
                  >
                    📋 비상장 회사 (재무제표 조회 불가)
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <section className="search-section">
      <h2 style={{ marginBottom: "1rem" }}>🔍 회사 검색</h2>
      <div className="guide" style={{ marginBottom: "1rem" }}>
        재무제표, 주가를 확인하고 싶은 회사를 검색해보세요
      </div>
      <div className="search-box">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="회사명을 입력하세요 (예: 삼성전자, SK하이닉스)"
          disabled={isSearching}
        />
        <button onClick={searchCompanies} disabled={isSearching}>
          {isSearching ? "검색 중..." : "검색"}
        </button>
      </div>
      {renderSearchResults()}
    </section>
  );
}

'use client';

import { useState } from 'react';

export default function CompanySearch({ onCompanySelect, onError }) {
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const searchCompanies = async () => {
    if (!query.trim()) {
      onError('검색어를 입력해주세요.');
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
        throw new Error(data.error || '검색 중 오류가 발생했습니다.');
      }

      setSearchResults(data.results || []);
    } catch (error) {
      console.error('검색 오류:', error);
      onError(error.message);
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      searchCompanies();
    }
  };

  const selectCompany = (company) => {
    onCompanySelect({
      corp_code: company.corp_code,
      corp_name: company.corp_name,
      stock_code: company.stock_code,
    });
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
            company.stock_code && company.stock_code.trim() !== '';

          return (
            <div
              key={company.corp_code}
              className="company-item"
              onClick={() => selectCompany(company)}
            >
              <div className="company-header">
                <h4>{company.corp_name}</h4>
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
                  회사코드: {company.corp_code} | 종목코드:{' '}
                  {company.stock_code || '없음'}
                </p>
                {company.corp_eng_name && (
                  <p>영문명: {company.corp_eng_name}</p>
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
      <h2>🔍 회사 검색</h2>
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
          {isSearching ? '검색 중...' : '검색'}
        </button>
      </div>
      {renderSearchResults()}
    </section>
  );
}

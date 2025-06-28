"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isHomePage = pathname === "/";
  const isCompanyPage = pathname.startsWith("/company/");
  const isChartPage = pathname.startsWith("/chart/");

  // 현재 페이지에서 종목코드 추출
  const getStockCode = () => {
    if (isCompanyPage) {
      return pathname.split("/")[2];
    }
    if (isChartPage) {
      return pathname.split("/")[2];
    }
    return null;
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const navigateHome = () => {
    router.push("/");
    setIsMobileMenuOpen(false);
  };

  const goBack = () => {
    router.back();
    setIsMobileMenuOpen(false);
  };

  const navigateToChart = () => {
    const stockCode = getStockCode();
    if (stockCode) {
      router.push(`/chart/${stockCode}`);
      setIsMobileMenuOpen(false);
    }
  };

  const navigateToCompany = () => {
    const stockCode = getStockCode();
    if (stockCode) {
      router.push(`/company/${stockCode}`);
      setIsMobileMenuOpen(false);
    }
  };

  return (
    <header className="app-header">
      <div className="header-container">
        {/* 로고 및 제목 영역 */}
        <div className="header-brand" onClick={navigateHome}>
          <div className="logo">📊</div>
          <div className="brand-text">
            <h1>재무제표 시각화</h1>
            <span className="subtitle">Financial Statement Visualizer</span>
          </div>
        </div>

        {/* 네비게이션 메뉴 (데스크톱) */}
        <nav className="header-nav desktop-nav">
          <button
            className={`nav-item ${isHomePage ? "active" : ""}`}
            onClick={navigateHome}
          >
            <span className="nav-icon">🏠</span>
            <span className="nav-text">홈</span>
          </button>

          {isCompanyPage && (
            <>
              <button className="nav-item" onClick={navigateToChart}>
                <span className="nav-icon">📈</span>
                <span className="nav-text">차트보기</span>
              </button>
              <button className="nav-item" onClick={goBack}>
                <span className="nav-icon">←</span>
                <span className="nav-text">뒤로가기</span>
              </button>
            </>
          )}

          {isChartPage && (
            <>
              <button className="nav-item" onClick={navigateToCompany}>
                <span className="nav-icon">📊</span>
                <span className="nav-text">재무제표</span>
              </button>
              <button className="nav-item" onClick={goBack}>
                <span className="nav-icon">←</span>
                <span className="nav-text">뒤로가기</span>
              </button>
            </>
          )}
        </nav>

        {/* 모바일 햄버거 메뉴 버튼 */}
        <button
          className="mobile-menu-btn"
          onClick={toggleMobileMenu}
          aria-label="메뉴 열기/닫기"
        >
          <span className={`hamburger ${isMobileMenuOpen ? "active" : ""}`}>
            <span></span>
            <span></span>
            <span></span>
          </span>
        </button>
      </div>

      {/* 모바일 드롭다운 메뉴 */}
      <div className={`mobile-nav ${isMobileMenuOpen ? "active" : ""}`}>
        <button
          className={`mobile-nav-item ${isHomePage ? "active" : ""}`}
          onClick={navigateHome}
        >
          <span className="nav-icon">🏠</span>
          <span className="nav-text">홈</span>
        </button>

        {isCompanyPage && (
          <>
            <button className="mobile-nav-item" onClick={navigateToChart}>
              <span className="nav-icon">📈</span>
              <span className="nav-text">차트보기</span>
            </button>
            <button className="mobile-nav-item" onClick={goBack}>
              <span className="nav-icon">←</span>
              <span className="nav-text">뒤로가기</span>
            </button>
          </>
        )}

        {isChartPage && (
          <>
            <button className="mobile-nav-item" onClick={navigateToCompany}>
              <span className="nav-icon">📊</span>
              <span className="nav-text">재무제표</span>
            </button>
            <button className="mobile-nav-item" onClick={goBack}>
              <span className="nav-icon">←</span>
              <span className="nav-text">뒤로가기</span>
            </button>
          </>
        )}

        <div className="mobile-nav-info">
          <p>한국 상장기업의 재무제표를</p>
          <p>쉽게 조회하고 분석해보세요</p>
        </div>
      </div>

      {/* 모바일 메뉴 오버레이 */}
      {isMobileMenuOpen && (
        <div
          className="mobile-overlay"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </header>
  );
}

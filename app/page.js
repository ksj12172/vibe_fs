"use client";

import { Suspense, useState } from "react";
import { useRouter } from "next/navigation";
import StockSearch from "../components/StockSearch";
import ErrorSection from "../components/ErrorSection";
import QuickAccessToFredData from "../components/QuickAccessToFredData";

const COLOR = {
  korea: "#007BFF",
  us: "#28A745",
  china: "#DC3545",
};
const ETF_TICKER_LIST = {
  korea: [
    { name: "TIGER 200", stockCode: "102110" },
    { name: "PLUS 고배당주", stockCode: "161510" },
    { name: "TIGER 은행고배당플러스TOP10", stockCode: "466940" },
  ],
  us: [
    { name: "TIGER 미국S&P500", stockCode: "360750" },
    { name: "TIGER 미국나스닥100", stockCode: "133690" },
    { name: "TIGER 미국테크TOP10 INDXX", stockCode: "381170" },
    { name: "TIGER 미국필라델피아AI반도체나스닥", stockCode: "497570" },
  ],
  china: [{ name: "TIGER 차이나항셍테크", stockCode: "371160" }],
  world: [{ name: "VT", stockCode: "VT" }],
};
const COIN_TICKER_LIST = [
  { name: "비트코인", stockCode: "BTC-USD" },
  { name: "이더리움", stockCode: "ETH-USD" },
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

  const handleStockClick = (stockCode) => {
    // ETF 차트 페이지로 이동 (기본 period: 3mo)
    router.push(`/chart/${stockCode}?period=3mo`);
  };

  return (
    <div className="container">
      <main>
        {/* 경제 지표 바로가기 */}
        <QuickAccessToFredData />

        {/* ETF 차트 바로가기 */}
        <section className="quick-access">
          <h3 className="title">
            📈 차트 바로가기
          </h3>
          <div>
            <div className="full-width">
              {ETF_TICKER_LIST.korea.map((item) => (
                <button
                  key={item.stockCode}
                  onClick={() => handleStockClick(item.stockCode)}
                  className="quick-btn"
                  style={{
                    color: COLOR.korea,
                  }}
                >
                  🇰🇷 {item.name}
                </button>
              ))}
            </div>
            <div className="full-width">
              {ETF_TICKER_LIST.us.map((item) => (
                <button
                  key={item.stockCode}
                  onClick={() => handleStockClick(item.stockCode)}
                  className="quick-btn"
                  style={{
                    color: COLOR.us,
                  }}
                >
                  🇺🇸 {item.name}
                </button>
              ))}
            </div>
            <div className="full-width">
              {ETF_TICKER_LIST.china.map((item) => (
                <button
                  onClick={() => handleStockClick(item.stockCode)}
                  className="quick-btn"
                  style={{
                    color: COLOR.china,
                  }}
                >
                  🇨🇳 {item.name}
                </button>
              ))}
            </div>
            <div className="full-width">
              {ETF_TICKER_LIST.world.map((item) => (
                <button
                  key={item.stockCode}
                  onClick={() => handleStockClick(item.stockCode)}
                  className="quick-btn"
                  style={{ color: COLOR.world }}
                >
                  🌏 {item.name}
                </button>
              ))}
            </div>
            <div className="full-width">
              {COIN_TICKER_LIST.map((item) => (
                <button
                  key={item.stockCode}
                  onClick={() => handleStockClick(item.stockCode)}
                  className="quick-btn"
                  style={{ color: COLOR.world }}
                >
                  🌝 {item.name}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* 주식 검색 */}
        <Suspense fallback={<div>Loading...</div>}>
          <StockSearch onError={handleError} />
        </Suspense>

        {/* 오류 메시지 */}
        {errorMessage && (
          <ErrorSection message={errorMessage} onReset={resetError} />
        )}
      </main>
    </div>
  );
}

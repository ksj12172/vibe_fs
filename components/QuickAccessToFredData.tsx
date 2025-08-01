'use client';

import { useRouter } from 'next/navigation';

export default function QuickAccessToFredData() {
  const router = useRouter();

  const handleEconomicClick = (seriesId: string) => {
    // 경제 지표 페이지로 이동
    router.push(`/economic/${seriesId}`);
  };

  return (
    <section className="quick-access quick-access-fred">
          <h3 className="title">
            📊 경제 지표 바로가기
          </h3>
          <div>
            <div className="full-width">
              <button
                onClick={() => handleEconomicClick("M2SL")}
                className="quick-btn"
              >
                💰 M2 통화량
              </button>
              <button
                onClick={() => handleEconomicClick("UNRATE")}
                className="quick-btn"
              >
                👥 실업률
              </button>
              <button
                onClick={() => handleEconomicClick("FEDFUNDS")}
                className="quick-btn"
              >
                📈 연방기금금리
              </button>
              <button
                onClick={() => handleEconomicClick("CPIAUCSL")}
                className="quick-btn"
              >
                📊 소비자물가지수
              </button>
            </div>
          </div>
        </section>
  );
}
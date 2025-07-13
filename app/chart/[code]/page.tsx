"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import CandlestickChart from "../../../components/CandlestickChart";

interface StockInfo {
  symbol_name: string;
  display_name: string;
  stock_code: string;
  description: AdditionalStockInfo;
}

/**
 * 기간 옵션 정의
 * Valid intervals: [1m, 2m, 5m, 15m, 30m, 60m, 90m, 1h, 4h, 1d, 5d, 1wk, 1mo, 3mo]"
 */
const PERIOD_OPTIONS = [
  { value: "1d", label: "1일", interval: "5m" },
  { value: "1wk", label: "1주", interval: "15m" },
  { value: "3mo", label: "3개월", interval: "1d" },
  { value: "1y", label: "1년", interval: "1wk" },
  { value: "5y", label: "5년", interval: "1mo" },
];

export default function ChartPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [stockInfo, setStockInfo] = useState<StockInfo | null>(null);
  const [chartData, setChartData] = useState<CandleData[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartLoading, setChartLoading] = useState(false); // 차트 영역만 로딩
  const [error, setError] = useState<string | null>(null);

  // 쿼리 파라미터에서 period 가져오기 (기본값: 3mo)
  const currentPeriod = searchParams.get('period') || '3mo';
  
  // 현재 period에 맞는 interval 가져오기
  const currentInterval = PERIOD_OPTIONS.find(option => option.value === currentPeriod)?.interval || '1d';

  const fetchData = async (period: string = currentPeriod, interval: string = currentInterval) => {
    try {
      setChartLoading(true); // 차트 영역만 로딩
      setError(null);

      // 실제 주식 데이터 가져오기 (yfinance)
      const apiUrl =
        process.env.NODE_ENV === "development"
          ? `http://localhost:${process.env.NEXT_PUBLIC_PYTHON_API_PORT}/api/stock-data/${params.code}?period=${period}&interval=${interval}`
          : `/api/stock-data/${params.code}?period=${period}&interval=${interval}`;

      const stockResponse = await fetch(apiUrl);

      if (stockResponse.ok) {
        const stockData: StockDataResponse = await stockResponse.json();

        if (stockData.success) {
          setChartData(stockData.data.candles);
          setStockInfo({
            symbol_name: stockData.data.symbol_name,
            display_name: stockData.data.display_name,
            stock_code: stockData.data.stock_code,
            description: stockData.data.stock_description,
          });
          setError(null);
        } else {
          setError("차트 데이터를 불러오지 못했습니다.");
        }
      } else {
        setError("차트 데이터를 불러오지 못했습니다.");
      }
    } catch (error) {
      setError("차트 데이터를 불러오지 못했습니다.");
    } finally {
      setChartLoading(false); // 차트 로딩 완료
    }
  };

  // 기간 변경 핸들러
  const handlePeriodChange = (period: string) => {
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set('period', period);
    router.push(`/chart/${params.code}?${newSearchParams.toString()}`);
  };

  useEffect(() => {
    if (params.code) {
      if (!stockInfo) {
        // 첫 로딩 시에만 전체 로딩
        setLoading(true);
        fetchData().finally(() => setLoading(false));
      } else {
        // 기간 변경 시에는 차트만 로딩
        fetchData();
      }
    }
  }, [params.code, currentPeriod]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">차트 데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 헤더 */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">
          {stockInfo ? stockInfo.symbol_name : "알 수 없음"}
        </h1>
        <p className="text-lg text-gray-600">종목코드: {params.code}</p>
      </div>

      {/* 종목 설명 */}
      {stockInfo && stockInfo.description && stockInfo.description.description && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg" style={{margin: '25px 0'}}>
          <h3 className="text-lg font-medium mb-3 text-gray-800">📋 종목 상세 정보</h3>
          <div
            dangerouslySetInnerHTML={{
              __html: stockInfo.description.description
            }}
            className="text-sm text-gray-700 leading-relaxed"
          />
          {stockInfo.description.sector && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
              {stockInfo.description.sector && (
                <div>
                  <strong className="text-gray-800">섹터:</strong> {stockInfo.description.sector}
                </div>
              )}
              {stockInfo.description.industry && (
                <div>
                  <strong className="text-gray-800">산업:</strong> {stockInfo.description.industry}
                </div>
              )}
              {stockInfo.description.founded && (
                <div>
                  <strong className="text-gray-800">설립일:</strong> {stockInfo.description.founded}
                </div>
              )}
              {stockInfo.description.headquarters && (
                <div>
                  <strong className="text-gray-800">본사:</strong> {stockInfo.description.headquarters}
                </div>
              )}
            </div>
          )}
          {stockInfo.description.website && (
            <div className="mt-3">
              <a
                href={stockInfo.description.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 text-sm underline"
              >
                🌐 공식 웹사이트 방문 →
              </a>
            </div>
          )}
        </div>
      )}



      {/* 기간 선택 메뉴 */}
      <div className="mb-6">
        <div className="bg-white rounded-lg shadow-sm border p-4" style={{margin: '25px 0'}}>
          <h3 className="text-lg font-medium mb-3 text-gray-800">📊 차트 기간 선택</h3>
          <div className="flex flex-wrap gap-2">
            {PERIOD_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => handlePeriodChange(option.value)}
                disabled={chartLoading}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                  currentPeriod === option.value
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-sm'
                } ${chartLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 차트 컨테이너 */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        {/* 차트 로딩 오버레이 */}
        {chartLoading && (
          <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10 rounded-lg">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-2 text-gray-600 text-sm">차트 데이터를 불러오는 중...</p>
            </div>
          </div>
        )}
        
        {/* 실제 차트 영역 */}
        {error ? (
          <div className="h-96 flex items-center justify-center text-red-500 text-lg font-semibold">
            {error}
          </div>
        ) : (
          <CandlestickChart
            data={chartData}
            displayName={stockInfo ? stockInfo.display_name : "알 수 없음"}
          />
        )}

        {/* 차트 데이터 미리보기 */}
        {!error && (
          <div className="mt-6">
            <h3 className="text-lg font-medium mb-3">최근 데이터</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-2 text-left">날짜</th>
                    <th className="px-4 py-2 text-right">시가</th>
                    <th className="px-4 py-2 text-right">고가</th>
                    <th className="px-4 py-2 text-right">저가</th>
                    <th className="px-4 py-2 text-right">종가</th>
                    <th className="px-4 py-2 text-right">거래량</th>
                  </tr>
                </thead>
                <tbody>
                  {chartData
                    .slice(-5)
                    .reverse()
                    .map((item, index) => (
                      <tr key={index} className="border-b">
                        <td className="px-4 py-2">{item.time}</td>
                        <td className="px-4 py-2 text-right">
                          {item.open.toLocaleString()}
                        </td>
                        <td className="px-4 py-2 text-right text-red-600">
                          {item.high.toLocaleString()}
                        </td>
                        <td className="px-4 py-2 text-right text-blue-600">
                          {item.low.toLocaleString()}
                        </td>
                        <td className="px-4 py-2 text-right font-medium">
                          {item.close.toLocaleString()}
                        </td>
                        <td className="px-4 py-2 text-right text-gray-600">
                          {item.volume ? item.volume.toLocaleString() : "N/A"}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 
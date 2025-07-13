"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import CandlestickChart from "../../../components/CandlestickChart";

interface StockInfo {
  symbol_name: string;
  display_name: string;
  stock_code: string;
  description: AdditionalStockInfo;
}


export default function ChartPage() {
  const params = useParams();
  const [stockInfo, setStockInfo] = useState<StockInfo | null>(null);
  const [chartData, setChartData] = useState<CandleData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 실제 주식 데이터 가져오기 (yfinance)
        const apiUrl =
          process.env.NODE_ENV === "development"
            ? `http://localhost:${process.env.NEXT_PUBLIC_PYTHON_API_PORT}/api/stock-data/${params.code}?period=3mo&interval=1d`
            : `/api/stock-data/${params.code}?period=3mo&interval=1d`;

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
        setLoading(false);
      }
    };

    if (params.code) {
      fetchData();
    }
  }, [params.code]);

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

      {/* 차트 컨테이너 */}
      <div className="bg-white rounded-lg shadow-lg p-6">
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
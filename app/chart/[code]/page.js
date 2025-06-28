"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import CandlestickChart from "../../../components/CandlestickChart";

export default function ChartPage() {
  const params = useParams();
  const [companyInfo, setCompanyInfo] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
          const stockData = await stockResponse.json();
          if (stockData.success) {
            setChartData(stockData.data.candles);
            setCompanyInfo({
              company_name: stockData.data.company_name,
              stock_code: stockData.data.stock_code,
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
          {companyInfo ? companyInfo.company_name : "알 수 없음"}
        </h1>
        <p className="text-lg text-gray-600">종목코드: {params.code}</p>
      </div>

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
            companyName={companyInfo ? companyInfo.company_name : "알 수 없음"}
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

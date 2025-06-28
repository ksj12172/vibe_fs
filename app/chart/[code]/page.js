"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import CandlestickChart from "../../../components/CandlestickChart";

// 임시 캔들 데이터 (카카오 예시)
const generateSampleData = () => {
  const data = [];
  let basePrice = 50000; // 카카오 기준 가격

  for (let i = 0; i < 100; i++) {
    const date = new Date();
    date.setDate(date.getDate() - (100 - i));

    const open = basePrice + (Math.random() - 0.5) * 2000;
    const close = open + (Math.random() - 0.5) * 3000;
    const high = Math.max(open, close) + Math.random() * 1000;
    const low = Math.min(open, close) - Math.random() * 1000;

    data.push({
      time: date.toISOString().split("T")[0],
      open: Math.round(open),
      high: Math.round(high),
      low: Math.round(low),
      close: Math.round(close),
    });

    basePrice = close;
  }

  return data;
};

export default function ChartPage() {
  const params = useParams();
  const [companyInfo, setCompanyInfo] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 실제 주식 데이터 가져오기 (yfinance)
        // 로컬 개발: Python Flask 서버
        // 배포: Vercel Python API
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
          } else {
            console.error("주식 데이터 조회 실패:", stockData.error);
            // 실패 시 임시 데이터 사용
            const sampleData = generateSampleData();
            setChartData(sampleData);

            // 기존 회사 정보 API도 시도
            const companyResponse = await fetch(
              `/api/company-by-code?code=${params.code}`
            );
            if (companyResponse.ok) {
              const companyData = await companyResponse.json();
              setCompanyInfo(companyData);
            }
          }
        } else {
          console.error("API 호출 실패, 임시 데이터 사용");
          // API 실패 시 임시 데이터 사용
          const sampleData = generateSampleData();
          setChartData(sampleData);

          // 기존 회사 정보 API도 시도
          const companyResponse = await fetch(
            `/api/company-by-code?code=${params.code}`
          );
          if (companyResponse.ok) {
            const companyData = await companyResponse.json();
            setCompanyInfo(companyData);
          }
        }
      } catch (error) {
        console.error("데이터 로딩 실패:", error);
        // 에러 시 임시 데이터 사용
        const sampleData = generateSampleData();
        setChartData(sampleData);
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
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-gray-800">주가 차트</h2>
          <p className="text-sm text-gray-500">
            TradingView Lightweight Charts (구현 예정)
          </p>
        </div>

        {/* 실제 차트 영역 */}
        <div style={{ height: "400px", overflow: "hidden" }}>
          <CandlestickChart
            data={chartData}
            companyName={companyInfo ? companyInfo.company_name : "알 수 없음"}
          />
        </div>

        {/* 차트 데이터 미리보기 */}
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
      </div>
    </div>
  );
}

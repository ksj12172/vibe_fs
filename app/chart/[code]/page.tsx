"use client";

import { useEffect, useState, Suspense } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import {
  useStockStore,
  StockInfo as ZustandStockInfo,
} from "../../../lib/stockStore";
import CandlestickChart from "@/components/CandlestickChart";

interface StockInfo extends Partial<Omit<ZustandStockInfo, "id">> {
  id?: string;
  symbol_name?: string;
  corp_name?: string;
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

function ChartPageContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [stockInfo, setStockInfo] = useState<StockInfo | null>(null);
  const [chartData, setChartData] = useState<StockData | null>(null);
  const [loading, setLoading] = useState(true);
  const [chartLoading, setChartLoading] = useState(false); // 차트 영역만 로딩
  const [error, setError] = useState<string | null>(null);

  // Zustand store 사용
  const { getStockBySymbol } = useStockStore();

  // 쿼리 파라미터에서 period 가져오기 (기본값: 3mo)
  const currentPeriod = searchParams.get("period") || "3mo";

  // 현재 period에 맞는 interval 가져오기
  const currentInterval =
    PERIOD_OPTIONS.find((option) => option.value === currentPeriod)?.interval ||
    "1d";

  const fetchCandleChartData = async (
    period: string = currentPeriod,
    interval: string = currentInterval
  ) => {
    const apiUrl =
      process.env.NODE_ENV === "development"
        ? `http://localhost:${process.env.NEXT_PUBLIC_PYTHON_API_PORT}/api/stock-data/${params.code}?period=${period}&interval=${interval}`
        : `/api/stock-data/${params.code}?period=${period}&interval=${interval}`;

    const response = await fetch(apiUrl);

    if (!response.ok) {
      throw new Error("주식 데이터를 불러오지 못했습니다.");
    }

    const candleChartData: StockCandleChartDataResponse = await response.json();

    if (!candleChartData.success) {
      throw new Error("주식 데이터를 불러오지 못했습니다.");
    }

    return candleChartData;
  };

  const fetchStockInfo = async () => {
    try {
      // 1. 먼저 Zustand store에서 주식 정보 확인
      const cachedStock = getStockBySymbol(params.code as string);

      if (cachedStock) {
        console.log("✅ Zustand store에서 주식 정보 발견:", cachedStock);

        // StockInfo 인터페이스에 맞게 변환
        return getStockInfo(cachedStock);
      }

      // 2. store에 없으면 새로운 Stock API 호출
      console.log("🔍 Store에 없음. Stock API 호출 중...");
      const response = await fetch(
        `/api/stock-by-code?stock_code=${params.code}`
      );

      if (!response.ok) {
        // Stock data is optional, don't throw error
        console.warn("주식 정보를 찾을 수 없습니다:", response.status);
        return null;
      }

      const stockData = await response.json();

      if (!stockData.success) {
        console.warn("주식 정보를 불러오지 못했습니다");
        return null;
      }

      // StockInfo 인터페이스에 맞게 변환
      return getStockInfo(stockData.stock);
    } catch (error) {
      console.warn("주식 정보 조회 중 오류:", error);
      return null;
    }
  };

  const fetchData = async (
    period: string = currentPeriod,
    interval: string = currentInterval
  ) => {
    try {
      setChartLoading(true);
      setError(null);

      // 병렬로 두 API 호출
      const [candleChartData, stockInfoData] = await Promise.allSettled([
        fetchCandleChartData(period, interval),
        fetchStockInfo(),
      ]);

      // 주식 데이터는 필수
      if (candleChartData.status === "fulfilled") {
        setChartData(candleChartData.value.data);
        setStockInfo({
          symbol_name: candleChartData.value.data.symbol_name,
        });
      } else {
        setChartData(null);
        setStockInfo(null);

        throw new Error("차트 데이터를 불러오지 못했습니다.");
      }

      // 주식 정보는 선택적
      if (stockInfoData.status === "fulfilled" && stockInfoData.value) {
        const stockInfoValue = stockInfoData.value;
        console.log("stockInfoValue", stockInfoValue);

        setStockInfo((prev: StockInfo | null) => {
          if (prev) {
            return {
              ...prev,
              ...stockInfoValue,
            };
          }

          return stockInfoValue;
        });

        console.log("stockInfo", stockInfo);
      } else {
        console.log("주식 정보를 사용할 수 없습니다. 차트만 표시됩니다.");
        setStockInfo(null);
      }

      setError(null);
    } catch (error) {
      console.error("데이터 조회 오류:", error);
      setError(
        error instanceof Error
          ? error.message
          : "차트 데이터를 불러오지 못했습니다."
      );
    } finally {
      setChartLoading(false);
    }
  };

  const getStockInfo = (data: ZustandStockInfo) => {
    return {
      id: data.id.toString(),
      type: data.type,
      symbol: data.symbol,
      corp_name: data.nameKor || data.name,
      description: data.description,
      website: data.website,
      sector: data.sector,
      industry: data.industry,
      logo: data.logo,
    };
  };

  // 기간 변경 핸들러
  const handlePeriodChange = (period: string) => {
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set("period", period);
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
        <div
          style={{
            display: "flex",
            alignItems: "center",
            marginBottom: "20px",
          }}
        >
          {stockInfo?.logo && (
            <Image
              src={stockInfo.logo}
              alt="logo"
              width={50}
              height={50}
              style={{
                width: "50px",
                height: "50px",
                objectFit: "contain",
                marginRight: "10px",
                borderRadius: "50%",
              }}
            />
          )}
          <h1 className="text-3xl font-bold text-gray-800">
            {stockInfo ? stockInfo.symbol_name : "알 수 없음"}
          </h1>
        </div>
        <p className="text-lg text-gray-600">종목코드: {params.code}</p>
      </div>

      {/* 종목 설명 */}
      {stockInfo?.description && (
        <div
          className="mb-6 p-4 bg-gray-50 rounded-lg"
          style={{ margin: "15px 0" }}
        >
          <h2 className="text-xl font-semibold mb-3 text-gray-800">
            종목 정보
          </h2>

          {stockInfo.website && (
            <div className="mt-3">
              <a
                href={stockInfo.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 underline"
              >
                🌐 공식 웹사이트 방문
              </a>
            </div>
          )}
          <div className="mt-3 grid grid-cols-2 gap-4 text-sm text-gray-600">
            {stockInfo.sector && (
              <div>
                <span className="font-medium">섹터:</span> {stockInfo.sector}
              </div>
            )}
            {stockInfo.industry && (
              <div>
                <span className="font-medium">산업:</span> {stockInfo.industry}
              </div>
            )}
          </div>
          <div
            className="text-gray-700 leading-relaxed"
            dangerouslySetInnerHTML={{
              __html: stockInfo.description,
            }}
          />
        </div>
      )}

      {/* 기간 선택 버튼 */}
      <div className="mb-6" style={{ margin: "15px 0" }}>
        <h3 className="text-lg font-medium mb-3 text-gray-800">
          📊 차트 기간 선택
        </h3>

        <div className="flex flex-wrap gap-2">
          {PERIOD_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => handlePeriodChange(option.value)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                currentPeriod === option.value
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* 차트 영역 */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        {chartLoading ? (
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-4 text-gray-600">차트 업데이트 중...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <p className="text-red-600 text-lg mb-4">{error}</p>
              <button
                onClick={() => fetchData()}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                다시 시도
              </button>
            </div>
          </div>
        ) : chartData && chartData.candles && chartData.candles.length > 0 ? (
          <CandlestickChart
            data={chartData}
            displayName={
              stockInfo?.corp_name ||
              stockInfo?.symbol_name ||
              (params.code as string)
            }
          />
        ) : (
          <div className="flex items-center justify-center h-96">
            <p className="text-gray-600">차트 데이터가 없습니다.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ChartPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">페이지를 불러오는 중...</p>
          </div>
        </div>
      }
    >
      <ChartPageContent />
    </Suspense>
  );
}

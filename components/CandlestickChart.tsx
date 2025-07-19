"use client";

import { IChartApi, ISeriesApi } from "lightweight-charts";
import { useEffect, useRef } from "react";

export default function CandlestickChart({
  data,
  displayName,
}: {
  data: CandleData[];
  displayName: string;
}) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);

  useEffect(() => {
    const initChart = async () => {
      try {
        if (!chartContainerRef.current) {
          return;
        }
        const LightweightCharts = await import("lightweight-charts");
        const { createChart, ColorType, CandlestickSeries } = LightweightCharts;

        // 기존 차트 안전하게 제거
        if (chartRef.current) {
          try {
            if (typeof chartRef.current.remove === "function") {
              chartRef.current.remove();
            }
          } catch (e) {
            // 이미 dispose된 경우 무시
          }
          chartRef.current = null;
        }

        // 차트 생성
        const chart = createChart(chartContainerRef.current, {
          width: chartContainerRef.current.clientWidth || 600,
          height: 400,
          layout: {
            background: { type: ColorType.Solid, color: "#ffffff" },
            textColor: "#333",
          },
          grid: {
            vertLines: { color: "#e1e1e1" },
            horzLines: { color: "#e1e1e1" },
          },
          rightPriceScale: { borderColor: "#cccccc" },
          timeScale: {
            borderColor: "#cccccc",
            timeVisible: true,
            secondsVisible: false,
          },
        });
        chartRef.current = chart;

        // 빨강(양봉)/파랑(음봉) 색상으로 candlestickSeries 생성
        const candlestickSeries = chart.addSeries(CandlestickSeries, {
          upColor: "#ED5858",
          downColor: "#5889ED",
          borderUpColor: "#ED5858",
          borderDownColor: "#5889ED",
          wickUpColor: "#ED5858",
          wickDownColor: "#5889ED",
        });

        candlestickSeriesRef.current = candlestickSeries;

        // 데이터 변환 및 설정
        if (data && data.length > 0) {
          try {
            const chartData = data.map((item) => ({
              time: item.time as any,
              open:
                typeof item.open === "string"
                  ? parseFloat(item.open)
                  : item.open,
              high:
                typeof item.high === "string"
                  ? parseFloat(item.high)
                  : item.high,
              low:
                typeof item.low === "string" ? parseFloat(item.low) : item.low,
              close:
                typeof item.close === "string"
                  ? parseFloat(item.close)
                  : item.close,
            }));

            candlestickSeries.setData(chartData);

            setTimeout(() => {
              if (chart && chart.timeScale) {
                chart.timeScale().fitContent();
              }
            }, 100);
          } catch (error) {
            console.error("데이터 설정 중 에러:", error);
          }
        }

        // 반응형 처리
        const handleResize = () => {
          try {
            if (chartRef.current && chartContainerRef.current) {
              const newWidth = chartContainerRef.current.clientWidth;
              if (newWidth > 0) {
                chartRef.current.applyOptions({ width: newWidth });
              }
            }
          } catch (error) {
            // 무시
          }
        };
        window.addEventListener("resize", handleResize);
        return () => {
          window.removeEventListener("resize", handleResize);
        };
      } catch (error) {
        console.error("TradingView 차트 초기화 실패:", error);
      }
    };

    if (data && data.length > 0) {
      initChart();
    }

    return () => {
      // 안전하게 차트 제거
      if (chartRef.current) {
        try {
          if (typeof chartRef.current.remove === "function") {
            chartRef.current.remove();
          }
        } catch (e) {
          // 이미 dispose된 경우 무시
        }
        chartRef.current = null;
      }
    };
  }, [data, displayName]);

  return (
    <div className="w-full relative">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-800">
          {displayName} 캔들스틱 차트
        </h3>
      </div>
      <div
        ref={chartContainerRef}
        className="w-full border border-gray-200 rounded-lg"
        style={{ height: "400px" }}
      />
      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-500">데이터 포인트:</span>
            <span className="ml-2 font-medium">{data?.length || 0}개</span>
          </div>
          <div>
            <span className="text-gray-500">기간:</span>
            <span className="ml-2 font-medium">
              {data?.length > 0
                ? `${data[0].time} ~ ${data[data.length - 1].time}`
                : "N/A"}
            </span>
          </div>
          <div>
            <span className="text-gray-500">최고가:</span>
            <span className="ml-2 font-medium text-red-600">
              {data?.length > 0
                ? Math.max(...data.map((d) => d.high)).toLocaleString() + "원"
                : "N/A"}
            </span>
          </div>
          <div>
            <span className="text-gray-500">최저가:</span>
            <span className="ml-2 font-medium text-blue-600">
              {data?.length > 0
                ? Math.min(...data.map((d) => d.low)).toLocaleString() + "원"
                : "N/A"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

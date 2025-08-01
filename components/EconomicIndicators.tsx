"use client";

import {
  IChartApi,
  ISeriesApi,
  LineData,
  LineSeries,
  Time,
  UTCTimestamp,
} from "lightweight-charts";
import React, { useEffect, useRef, useState } from "react";

interface EconomicData {
  time: number;
  value: number;
}

interface EconomicIndicatorsProps {
  seriesId: string;
  title: string;
  data: EconomicData[];
}

const formatValue = (value: number): string => {
  if (value >= 1000000) {
    return (value / 1000000).toFixed(2) + "T"; // Trillion
  } else if (value >= 1000) {
    return (value / 1000).toFixed(2) + "B"; // Billion
  } else {
    return value.toLocaleString();
  }
};

const getDateRange = (data: EconomicData[]) => {
  if (data.length === 0) return "N/A";
  
  const firstDate = new Date(data[0].time * 1000);
  const lastDate = new Date(data[data.length - 1].time * 1000);

  const options: Intl.DateTimeFormatOptions = {
    timeZone: "America/New_York", // FRED uses US timezone
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  };

  return `${firstDate.toLocaleDateString(
    "ko-KR",
    options
  )} ~ ${lastDate.toLocaleDateString("ko-KR", options)}`;
};

export default function EconomicIndicators({
  seriesId,
  title,
  data,
}: EconomicIndicatorsProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const lineSeriesRef = useRef<ISeriesApi<"Line"> | null>(null);

  const maxValue = data.length > 0 ? Math.max(...data.map(d => d.value)) : 0;
  const minValue = data.length > 0 ? Math.min(...data.map(d => d.value)) : 0;
  const latestValue = data.length > 0 ? data[data.length - 1].value : 0;

  useEffect(() => {
    const initChart = async () => {
      try {
        if (!chartContainerRef.current || data.length === 0) {
          return;
        }

        const LightweightCharts = await import("lightweight-charts");
        const { createChart, ColorType } = LightweightCharts;

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
          localization: {
            locale: "ko-KR",
            dateFormat: "yyyy-MM-dd",
          },
        });
        chartRef.current = chart;

        // 라인 시리즈 생성
        const lineSeries = chart.addSeries(LineSeries, {
          color: "#2196F3",
          lineWidth: 2,
          crosshairMarkerVisible: true,
          crosshairMarkerRadius: 6,
          crosshairMarkerBorderColor: "#2196F3",
          crosshairMarkerBackgroundColor: "#ffffff",
        });

        lineSeriesRef.current = lineSeries;

        // 데이터 변환 및 설정
        if (data && data.length > 0) {
          try {
            const chartData: LineData<Time>[] = data.map((item) => ({
              time: item.time as UTCTimestamp,
              value: item.value,
            }));

            lineSeries.setData(chartData);

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
        console.error("경제 지표 차트 초기화 실패:", error);
      }
    };

    if (data.length > 0) {
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
  }, [data]);

  return (
    <div className="w-full relative">
      <div className="mb-4">
        <h3 className="text-xl font-semibold text-gray-800">{title}</h3>
        <p className="text-sm text-gray-600">Series ID: {seriesId}</p>
      </div>

      <div
        ref={chartContainerRef}
        className="w-full border border-gray-200 rounded-lg"
        style={{ height: "400px" }}
      />

      <div style={{ margin: "20px 0" }}>
        <div>
          <span className="text-gray-500">데이터 포인트:</span>
          <span className="ml-2 font-medium">{data?.length || 0}개</span>
        </div>
        <div>
          <span className="text-gray-500">기간: </span>
          <span className="ml-2 font-medium">
            {data?.length > 0 ? getDateRange(data) : "N/A"}
          </span>
        </div>
        <div>
          <span className="text-gray-500">최신 값: </span>
          <span className="ml-2 font-medium text-blue-600">
            {formatValue(latestValue)}
          </span>
        </div>
        <div>
          <span className="text-gray-500">최대 값: </span>
          <span className="ml-2 font-medium text-red-600">
            {formatValue(maxValue)}
          </span>
        </div>
        <div>
          <span className="text-gray-500">최소 값: </span>
          <span className="ml-2 font-medium text-green-600">
            {formatValue(minValue)}
          </span>
        </div>
      </div>

      {seriesId === "M2SL" && (
        <div
          style={{
            marginTop: "20px",
            padding: "16px",
            backgroundColor: "#f8f9fa",
            borderRadius: "8px",
            fontSize: "14px",
            lineHeight: "1.6",
          }}
        >
          <h4
            style={{ margin: "0 0 12px 0", color: "#495057", fontSize: "16px" }}
          >
            📊 M2 통화량 (M2 Money Supply)
          </h4>
          <div style={{ display: "grid", gap: "8px" }}>
            <div>
              <strong style={{ color: "#007bff" }}>M2 통화량</strong>은 현금, 당좌예금, 
              저축예금, 단기 금융상품 등을 포함한 광의의 통화공급량입니다.
            </div>
            <div>
              M2는 경제의 유동성과 인플레이션 압력을 측정하는 중요한 지표로 사용됩니다.
            </div>
            <div>
              <strong style={{ color: "#28a745" }}>단위:</strong> 10억 달러 (Billions of Dollars)
            </div>
          </div>
          <div
            style={{
              marginTop: "12px",
              padding: "8px",
              backgroundColor: "#e9ecef",
              borderRadius: "4px",
              fontSize: "12px",
              color: "#6c757d",
            }}
          >
            💡 데이터 출처: Federal Reserve Economic Data (FRED)
          </div>
        </div>
      )}
    </div>
  );
} 
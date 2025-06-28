"use client";

import { useEffect, useRef } from "react";

// TradingView Lightweight Charts는 클라이언트 사이드에서만 동작하므로 동적 import 사용
let LightweightCharts;

const CandlestickChart = ({ data, companyName }) => {
  const chartContainerRef = useRef();
  const chartRef = useRef();

  useEffect(() => {
    const initChart = async () => {
      try {
        // 동적으로 lightweight-charts 라이브러리 로드
        if (typeof window !== "undefined") {
          // 임시로 Chart.js 사용 (lightweight-charts 설치 전)
          const { Chart, registerables } = await import("chart.js");
          Chart.register(...registerables);

          if (chartRef.current) {
            chartRef.current.destroy();
          }

          // 캔들스틱 차트 데이터 변환
          const labels = data.map((item) => item.time);
          const candleData = data.map((item) => ({
            x: item.time,
            o: item.open,
            h: item.high,
            l: item.low,
            c: item.close,
          }));

          const ctx = chartContainerRef.current.getContext("2d");

          // 캔버스 크기 명시적 설정
          chartContainerRef.current.width =
            chartContainerRef.current.offsetWidth;
          chartContainerRef.current.height = 400;

          chartRef.current = new Chart(ctx, {
            type: "line", // 임시로 선 차트 사용
            data: {
              labels: labels,
              datasets: [
                {
                  label: "종가",
                  data: data.map((item) => item.close),
                  borderColor: "rgb(75, 192, 192)",
                  backgroundColor: "rgba(75, 192, 192, 0.1)",
                  tension: 0.1,
                  fill: true,
                },
                {
                  label: "고가",
                  data: data.map((item) => item.high),
                  borderColor: "rgb(255, 99, 132)",
                  backgroundColor: "rgba(255, 99, 132, 0.1)",
                  tension: 0.1,
                  fill: false,
                },
                {
                  label: "저가",
                  data: data.map((item) => item.low),
                  borderColor: "rgb(54, 162, 235)",
                  backgroundColor: "rgba(54, 162, 235, 0.1)",
                  tension: 0.1,
                  fill: false,
                },
                {
                  label: "시가",
                  data: data.map((item) => item.open),
                  borderColor: "rgb(255, 206, 86)",
                  backgroundColor: "rgba(255, 206, 86, 0.1)",
                  tension: 0.1,
                  fill: false,
                },
              ],
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              aspectRatio: 2,
              layout: {
                padding: {
                  top: 10,
                  bottom: 10,
                  left: 10,
                  right: 10,
                },
              },
              plugins: {
                title: {
                  display: true,
                  text: `${companyName} 주가 차트`,
                },
                legend: {
                  display: true,
                  position: "top",
                },
              },
              scales: {
                x: {
                  display: true,
                  title: {
                    display: true,
                    text: "날짜",
                  },
                },
                y: {
                  display: true,
                  title: {
                    display: true,
                    text: "가격 (원)",
                  },
                  ticks: {
                    callback: function (value) {
                      return value.toLocaleString() + "원";
                    },
                  },
                },
              },
              interaction: {
                intersect: false,
                mode: "index",
              },
            },
          });
        }
      } catch (error) {
        console.error("차트 초기화 실패:", error);
      }
    };

    if (data && data.length > 0) {
      initChart();
    }

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
      }
    };
  }, [data, companyName]);

  return (
    <div className="w-full relative" style={{ height: "400px" }}>
      <canvas
        ref={chartContainerRef}
        style={{
          width: "100%",
          height: "100%",
          maxHeight: "400px",
        }}
      ></canvas>
      <div className="absolute top-4 right-4 bg-white bg-opacity-90 rounded p-2 text-sm">
        <div className="text-gray-600">임시 차트</div>
        <div className="text-xs text-gray-500">
          TradingView 차트로 업그레이드 예정
        </div>
      </div>
    </div>
  );
};

export default CandlestickChart;

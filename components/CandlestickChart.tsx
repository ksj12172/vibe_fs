"use client";

import {
  BusinessDay,
  CandlestickData,
  IChartApi,
  ISeriesApi,
  LineData,
  LineSeries,
  Time,
  UTCTimestamp,
  HistogramData,
  HistogramSeries,
  CreatePriceLineOptions,
} from "lightweight-charts";
import React, { useEffect, useRef, useState } from "react";
import OHLCAnalyzer from "./OHLCAnalyzer";
import Tooltip from "./Tooltip";
import { IoMdInformationCircleOutline } from "react-icons/io";
import { DateTime } from "luxon";

type Currency = "USD" | "KRW";

interface CandleDataWithModifiedTime extends CandleData {
  modifiedTime: Time;
}

interface MovingAveragePeriod {
  value: number;
  label: string;
  chartInstance: ISeriesApi<"Line"> | null;
  color: string;
}

const minMaxAvgPrice = (
  candleData: CandleDataWithModifiedTime[]
): {
  minPriceLineOption: CreatePriceLineOptions;
  maxPriceLineOption: CreatePriceLineOptions;
  avgPriceLineOption: CreatePriceLineOptions;
} | null => {
  if (candleData.length === 0) return null;

  let min = candleData[0].close;
  let max = min;

  candleData.forEach((d) => {
    const price = d.close;
    if (price > max) {
      max = price;
    }
    if (price < min) {
      min = price;
    }
  });

  const avg =
    candleData.reduce((sum, d) => sum + d.close, 0) / candleData.length;

  const lineWidth = 2;

  return {
    minPriceLineOption: {
      price: min,
      color: "#ef5350",
      lineWidth: lineWidth,
      lineStyle: 2, // LineStyle.Dashed
      axisLabelVisible: true,
      title: "min price",
    },
    maxPriceLineOption: {
      price: max,
      color: "#26a69a",
      lineWidth: lineWidth,
      lineStyle: 2, // LineStyle.Dashed
      axisLabelVisible: true,
      title: "max price",
    },
    avgPriceLineOption: {
      price: avg,
      color: "black",
      lineWidth: lineWidth,
      lineStyle: 1, // LineStyle.Dotted
      axisLabelVisible: true,
      title: "ave price",
    },
  };
};

const getTargetPrice = ({
  target,
  candleData,
  currency,
}: {
  target: "high" | "low";
  candleData: CandleDataWithModifiedTime[];
  currency: Currency;
}) => {
  if (candleData.length === 0) return "N/A";

  const isUSD = currency === "USD";
  const targetPrice =
    target === "high"
      ? Math.max(...candleData.map((d) => d.high))
      : Math.min(...candleData.map((d) => d.low));

  if (isUSD) {
    return "$" + targetPrice.toLocaleString();
  }

  return targetPrice.toLocaleString() + "원";
};

const getDateRange = (
  candleData: CandleDataWithModifiedTime[],
  interval: string
) => {
  const firstDate = new Date((candleData[0].time as number) * 1000);
  const lastDate = new Date(
    (candleData[candleData.length - 1].time as number) * 1000
  );

  let options: Intl.DateTimeFormatOptions = {
    timeZone: "Asia/Seoul", // 한국 시간 기준
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  };

  if (interval !== "1d") {
    options = {
      ...options,
      hour: "2-digit",
      minute: "2-digit",
    };
  }

  return `${firstDate.toLocaleDateString(
    "ko-KR",
    options
  )} ~ ${lastDate.toLocaleDateString("ko-KR", options)}`;
};

const KST_OFFSET = 9 * 60 * 60 * 1000;

/**
 * yfinance 일봉 데이터가 자정으로 돼 있어,
 * light-weight 차트에는 데이터에 해당하는 날짜가 전일로 나오는 이슈 수정
 *
 * 해결: 날짜만 남기고 시간은 넘기지 않는다
 */
const getTimeForLightweightChart = (
  interval: string,
  time: number
): UTCTimestamp | BusinessDay => {
  // lightweight-charts에서 timezone 처리가 안 돼서 timezone 만큼 직접 더함
  if (interval !== "1d") {
    const zoneAddedTime = Math.floor(
      (new Date(time * 1000).getTime() + KST_OFFSET) / 1000
    ) as UTCTimestamp;

    return zoneAddedTime;
  }

  const date = new Date(time * 1000);

  return {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
  };
};

const getRecentVolumeData = (
  interval: string,
  candleData: CandleDataWithModifiedTime[]
) => {
  if (interval !== "1d" || candleData.length === 0) {
    return null;
  }

  const recentData = candleData[candleData.length - 1];
  const formattedDate = DateTime.fromMillis(
    recentData.time * 1000 + KST_OFFSET
  ).toFormat("yy.M.d");

  return { volume: recentData.volume, label: `${formattedDate} 거래량` };
};

const calculateMovingAverageSeriesData = (
  candleData: CandleDataWithModifiedTime[],
  period: number
) => {
  const maData: LineData<Time>[] = [];

  if (candleData.length < period) {
    return maData;
  }

  /**
   * provide whitespace data points until the MA(moving average) can be calculated
   */
  for (let i = 0; i < period - 1; i++) {
    maData.push({ time: candleData[i].modifiedTime } as LineData<Time>);
  }

  /**
   * Calculate the moving average, slow but simple way
   */
  for (let i = period - 1; i < candleData.length; i++) {
    const ma =
      candleData
        .slice(i - period + 1, i + 1)
        .reduce((sum, d) => sum + d.close, 0) / period;

    maData.push({
      time: candleData[i].modifiedTime,
      value: ma,
    });
  }

  return maData;
};

export default function CandlestickChart({ data }: { data: StockData }) {
  const candleData = data.candles.map((candle) => ({
    ...candle,
    modifiedTime: getTimeForLightweightChart(data.interval, candle.time),
  }));

  const highestPrice = getTargetPrice({
    target: "high",
    candleData,
    currency: data.market_info.currency as Currency,
  });
  const lowestPrice = getTargetPrice({
    target: "low",
    candleData,
    currency: data.market_info.currency as Currency,
  });

  const [clickedPosition, setClickedPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);

  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);
  const [movingAveragePeriodChartList, setMovingAveragePeriodChartList] =
    useState<MovingAveragePeriod[]>([
      { value: 5, label: "5일", chartInstance: null, color: "#0AB563" },
      { value: 20, label: "20일", chartInstance: null, color: "#fe7baa" },
      { value: 60, label: "60일", chartInstance: null, color: "#0a6fff" },
      { value: 120, label: "120일", chartInstance: null, color: "#9b25f9" },
    ]);

  useEffect(() => {
    const initChart = async () => {
      try {
        if (!chartContainerRef.current) {
          return;
        }
        const LightweightCharts = await import("lightweight-charts");
        const { createChart, ColorType, CandlestickSeries, HistogramSeries } =
          LightweightCharts;

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
          height: 500,
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
            timeVisible: data.interval !== "1d",
            secondsVisible: false,
          },
          localization: {
            locale: "ko-KR",
            dateFormat: "yyyy-MM-dd",
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

        // 캔들 차트의 price scale 설정
        candlestickSeries.priceScale().applyOptions({
          scaleMargins: {
            top: 0.1,
            bottom: 0.1, // lowest point will be 10% away from the bottom
          },
        });

        /**
         * 거래량 차트 추가
         * https://tradingview.github.io/lightweight-charts/tutorials/how_to/price-and-volume
         */
        const volumeSeries = chart.addSeries(HistogramSeries, {
          color: "#26a69a",
          priceFormat: {
            type: "volume",
          },
          priceScaleId: "",
        });

        volumeSeriesRef.current = volumeSeries;

        // 거래량 차트의 price scale 설정
        volumeSeries.priceScale().applyOptions({
          scaleMargins: {
            top: 0.9, // highest point of the series will be 90% away from the top
            bottom: 0, // lowest point will be at the very bottom.
          },
        });

        // 데이터 변환 및 설정
        if (candleData && candleData.length > 0) {
          try {
            const candleStickData: CandlestickData<Time>[] = candleData.map(
              (item) => ({
                time: item.modifiedTime,
                open:
                  typeof item.open === "string"
                    ? parseFloat(item.open)
                    : item.open,
                high:
                  typeof item.high === "string"
                    ? parseFloat(item.high)
                    : item.high,
                low:
                  typeof item.low === "string"
                    ? parseFloat(item.low)
                    : item.low,
                close:
                  typeof item.close === "string"
                    ? parseFloat(item.close)
                    : item.close,
              })
            );

            candlestickSeries.setData(candleStickData);

            /**
             * min, max, avg 라인 추가
             * https://tradingview.github.io/lightweight-charts/tutorials/how_to/price-line
             */
            const priceList = minMaxAvgPrice(candleData);

            if (priceList) {
              candlestickSeries.createPriceLine(priceList.minPriceLineOption);
              candlestickSeries.createPriceLine(priceList.maxPriceLineOption);
              candlestickSeries.createPriceLine(priceList.avgPriceLineOption);
            }

            /**
             * 거래량 데이터 변환
             * 미국식 거래량 색깔: 캔들의 색깔과 동일
             * 한국식 거래량 색깔: 전날 거래량의 크기와 비교
             */
            const volumeData: HistogramData<Time>[] = candleData.map(
              (item) => ({
                time: item.modifiedTime,
                value: item.volume,
                color:
                  item.close >= item.open
                    ? "rgba(237, 88, 88, 0.5)"
                    : "rgba(88, 137, 237, 0.5)", // 상승/하락에 따른 색상
              })
            );

            volumeSeries.setData(volumeData);

            setTimeout(() => {
              try {
                if (chartRef.current && chartRef.current.timeScale) {
                  chartRef.current.timeScale().fitContent();
                }
              } catch (error) {
                // 차트가 이미 dispose된 경우 무시
                console.log("차트가 이미 dispose되었습니다.");
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
            // 차트가 이미 dispose된 경우 무시
            console.log("resize 중 차트가 이미 dispose되었습니다.");
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

    if (candleData.length > 0) {
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
        candlestickSeriesRef.current = null;
        volumeSeriesRef.current = null;
      }
    };
  }, [data]);

  const addMovingAverageLine = (
    period: { value: number; label: string },
    interval: "1d" | string
  ) => {
    try {
      if (!chartRef.current || interval !== "1d") return;

      const newList = [...movingAveragePeriodChartList];
      const targetIndex = newList.findIndex((p) => p.value === period.value);
      if (targetIndex === -1) return;

      const targetPeriod = newList[targetIndex];

      if (targetPeriod.chartInstance) {
        chartRef.current?.removeSeries(targetPeriod.chartInstance);
        newList[targetIndex] = { ...targetPeriod, chartInstance: null };
      } else {
        const maData = calculateMovingAverageSeriesData(
          candleData,
          period.value
        );

        const newChartInstance = chartRef.current?.addSeries(LineSeries, {
          color: targetPeriod.color,
          lineWidth: 1,
        });

        if (newChartInstance) {
          newChartInstance.setData(maData);
          newList[targetIndex] = {
            ...targetPeriod,
            chartInstance: newChartInstance,
          };
        }
      }

      setMovingAveragePeriodChartList(newList);
    } catch (error) {
      // 차트가 이미 dispose된 경우 무시
      console.log("이동평균선 추가 중 차트가 이미 dispose되었습니다.");
    }
  };

  // 현재 거래량 계산
  const recentVolumeData = getRecentVolumeData(data.interval, candleData);

  return (
    <div className="w-full relative">
      <div
        ref={chartContainerRef}
        className="w-full border border-gray-200 rounded-lg"
        style={{ height: "500px" }} // 높이를 늘려서 거래량 차트 공간 확보
      />

      {/* 이동 평균선 */}
      <div style={{ display: "flex", margin: "20px 0" }}>
        <button className="default-btn">
          🐚 이동평균선{" "}
          <IoMdInformationCircleOutline
            style={{ marginLeft: "3px", cursor: "pointer" }}
            onClick={(e) => {
              if (clickedPosition) {
                setClickedPosition(null);
              } else {
                setClickedPosition({
                  x: e.clientX,
                  y: e.clientY,
                });
              }
            }}
          />
        </button>
        {movingAveragePeriodChartList.map((period) => (
          <button
            key={period.value}
            onClick={() => addMovingAverageLine(period, data.interval)}
            className={`default-btn ${period.chartInstance && "selected-btn"}`}
            disabled={
              data.interval !== "1d" || candleData.length < period.value
            }
          >
            <span className={`text-with-line ${"bgColor" + period.value}`}>
              {period.label}
            </span>
          </button>
        ))}
      </div>

      <div style={{ margin: "20px 0" }}>
        <div>
          <span className="text-gray-500">데이터 포인트:</span>
          <span className="ml-2 font-medium">{candleData?.length || 0}개</span>
        </div>
        <div>
          <span className="text-gray-500">기간: </span>
          <span className="ml-2 font-medium">
            {candleData?.length > 0
              ? getDateRange(candleData, data.interval)
              : "N/A"}
          </span>
        </div>
        <div>
          <span className="text-gray-500">기간 중 최고가: </span>
          <span className="ml-2 font-medium text-red-600">{highestPrice}</span>
        </div>
        <div>
          <span className="text-gray-500">기간 중 최저가: </span>
          <span className="ml-2 font-medium text-blue-600">{lowestPrice}</span>
        </div>
        {recentVolumeData && (
          <div>
            <span className="text-gray-500">{recentVolumeData.label} </span>
            <span className="ml-2 font-medium text-green-600">
              {recentVolumeData.volume.toLocaleString()}
            </span>
          </div>
        )}
      </div>

      {data.interval === "1d" && candleData.length > 0 && (
        <OHLCAnalyzer
          data={candleData[candleData.length - 1]}
          isUSD={data.market_info.currency === "USD"}
        ></OHLCAnalyzer>
      )}

      <Tooltip
        isVisible={clickedPosition !== null}
        clickedPosition={clickedPosition || { x: 0, y: 0 }}
        onClose={() => setClickedPosition(null)}
      >
        주가의 일정 기간 평균값을 선으로 표시합니다.
        <br />
        5일, 20일, 60일, 120일 이동평균선을 제공합니다.
      </Tooltip>
    </div>
  );
}

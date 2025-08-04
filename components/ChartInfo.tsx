import React from "react";
import { CandleDataWithModifiedTime } from "./CandlestickChart";
import { DateTime } from "luxon";
import { KST_OFFSET } from "@/app/value";

interface ChartInfoProps {
  candleData: CandleDataWithModifiedTime[];
  interval: string;
  currency: Currency;
}

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

export default function ChartInfo({
  candleData,
  interval,
  currency,
}: ChartInfoProps) {
  // 현재 거래량 계산
  const recentVolumeData = getRecentVolumeData(interval, candleData);
  const dateRange = getDateRange(candleData, interval);

  const highestPrice = getTargetPrice({
    target: "high",
    candleData,
    currency,
  });
  const lowestPrice = getTargetPrice({
    target: "low",
    candleData,
    currency,
  });

  return (
    <div style={{ margin: "20px 0" }}>
      <div>
        <span className="text-gray-500">데이터 포인트:</span>
        <span className="ml-2 font-medium">{candleData?.length || 0}개</span>
      </div>
      {dateRange && (
        <div>
          <span className="text-gray-500">기간: </span>
          <span className="ml-2 font-medium">{dateRange}</span>
        </div>
      )}
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
  );
}

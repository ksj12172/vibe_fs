const formatPrice = (price: number, isUSD: boolean) => {
  return isUSD ? "$" + price.toLocaleString() : price.toLocaleString() + "원";
};

/**
 * Open, High, Low, Close 기준 분석
 * 해석 참고: https://newneek.co/@saltylife/article/18561?utm_source=article&utm_medium=share&utm_content=18561
 */
export default function OHLCAnalyzer({
  data: { open, close, low, high },
  isUSD,
}: {
  data: CandleData;
  isUSD: boolean;
}) {
  const totalRange = high - low;
  const isDoji = Math.abs(open - close) <= totalRange * 0.01;
  const isBullish = !isDoji && close > open;
  const isBearish = !isDoji && close < open;

  const color = isDoji ? "#dee2e6" : isBullish ? "#ED5858" : "#5889ED";

  const upperWickHeight = high - Math.max(open, close);
  const lowerWickHeight = Math.min(open, close) - low;
  const bodyHeight = Math.abs(open - close);
  const totalHeight = upperWickHeight + lowerWickHeight + bodyHeight;

  let analysis = "";

  if (!isDoji) {
    if (upperWickHeight > lowerWickHeight) {
      analysis = isBullish
        ? "약한 상승폭을 보였습니다."
        : "강한 하락폭을 보였습니다.";
    } else {
      analysis = isBullish
        ? "강한 상승폭을 보였습니다. \n 다음 날에도 주가 상승 흐름이 이어질 가능성이 높습니다."
        : "주가가 내려갔다가 강한 매수세로 저가보다는 오른채 마감했습니다. \n 상승할 여지가 남아있습니다.";
    }
  } else {
    // 십자형 도지
    const isStandardDoji =
      Math.abs(upperWickHeight - lowerWickHeight) <= totalRange * 0.1;
    // 비석형 도지
    const isGravestoneDoji =
      upperWickHeight >= totalRange * 0.6 &&
      lowerWickHeight <= totalRange * 0.1;
    // 잠자리형 도지
    const isDragonflyDoji =
      upperWickHeight <= totalRange * 0.1 &&
      lowerWickHeight >= totalRange * 0.6;

    analysis =
      "시가와 종가가 비슷한 도지 캔들은 주가의 추세가 뒤집힐 수 있다는 신호입니다. \n";
    if (isStandardDoji) {
      analysis =
        "십자형 도지 (시가 ≒  종가) \n 매도세와 매수세가 팽팽히 맞섰습니다. \n 주가가 전반적으로 상승하거나 하락하는 추세에 나타난다면, 해당 추세가 약해지고 주가가 반대 방향으로 움직일 가능성이 높아진 것입니다.";
    } else if (isGravestoneDoji) {
      analysis =
        "비석형 도지 (시가 ≒  종가 ≒  저가) \n 강한 매도세가 매수세를 누르며 시가와 같은 종가로 마감했습니다. \n 상승 추세의 고점에서 나타날 경우 하락 전환 신호일 수 있습니다. \n 하락세가 이어질 가능성이 높습니다.";
    } else if (isDragonflyDoji) {
      analysis =
        "잠자리형 도지 (시가 ≒  종가 ≒  고가) \n 강한 매수세가 들어와 매도세를 극복했습니다. \n 하락 추세의 저점에서 나타날 경우 상승 전환 신호일 수 있습니다. \n 주가가 상승할 가능성이 높습니다.";
    }
  }

  const priceList = [
    {
      name: "최고가",
      value: high,
      formattedValue: formatPrice(high, isUSD),
    },
    {
      name: "최저가",
      value: low,
      formattedValue: formatPrice(low, isUSD),
    },
    {
      name: "시가",
      value: open,
      formattedValue: formatPrice(open, isUSD),
    },
    {
      name: "종가",
      value: close,
      formattedValue: formatPrice(close, isUSD),
    },
  ];

  const orderedPriceList = priceList.sort((a, b) => b.value - a.value);

  return (
    <div style={{ marginTop: "20px" }}>
      <h3 style={{ margin: "10px 0" }}>OHLC 분석</h3>
      <p style={{ fontSize: "small", margin: "10px 0" }}>
        ❗️ 과거의 가격 데이터가 미래의 가격을 무조건 담보하지는 않으므로 참고만
        하세요.
      </p>
      <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
        <div style={{ marginTop: "10px" }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              height: "100px",
            }}
          >
            <div
              style={{
                width: "2px",
                height:
                  ((upperWickHeight / totalHeight) * 100).toFixed(2) + "%",
                backgroundColor: color,
              }}
            ></div>
            <div
              style={{
                width: "20px",
                height: ((bodyHeight / totalHeight) * 100).toFixed(2) + "%",
                backgroundColor: color,
              }}
            ></div>
            <div
              style={{
                width: "2px",
                height:
                  ((lowerWickHeight / totalHeight) * 100).toFixed(2) + "%",
                backgroundColor: color,
              }}
            ></div>
            <div style={{ marginTop: "10px", fontSize: "14px" }}>
              {isBullish
                ? "양봉 (종가 > 시가)"
                : isBearish
                ? "음봉 (종가 < 시가)"
                : "도지 (종가 ≒  시가)"}
            </div>
          </div>
        </div>
        <div>
          {orderedPriceList.map((price) => (
            <div>
              <span className="text-gray-500">{price.name}: </span>
              <span className="ml-2 font-medium text-red-600">
                {price.formattedValue}
              </span>
            </div>
          ))}
        </div>
        <div style={{ whiteSpace: "pre-line" }}>{analysis}</div>
      </div>
    </div>
  );
}

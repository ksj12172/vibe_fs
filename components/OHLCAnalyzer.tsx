import { DateTime } from "luxon";

const formatPrice = (price: number, isUSD: boolean) => {
  return isUSD ? "$" + price.toLocaleString() : price.toLocaleString() + "원";
};

/**
 * Open, High, Low, Close 기준 분석 (1d 캔들 데이터만 해당)
 * 해석 참고: https://newneek.co/@saltylife/article/18561?utm_source=article&utm_medium=share&utm_content=18561
 */
export default function OHLCAnalyzer({
  data: { time, volume, open, close, low, high },
  isUSD,
}: {
  data: CandleData;
  isUSD: boolean;
}) {
  const formattedDate = DateTime.fromMillis(time * 1000).toFormat(
    "yyyy년 MM월 dd일"
  );

  const totalRange = high - low;
  const isDoji = Math.abs(open - close) <= totalRange * 0.01;
  const isBullish = !isDoji && close > open;
  const isBearish = !isDoji && close < open;

  const color = isDoji ? "#dee2e6" : isBullish ? "#ED5858" : "#5889ED";

  const upperWick = high - Math.max(open, close);
  const lowerWick = Math.min(open, close) - low;
  const bodySize = Math.abs(open - close);
  const totalHeight = upperWick + lowerWick + bodySize;
  const bodyRatio = bodySize / totalRange;

  const isLogLowerWick =
    lowerWick >= bodySize * 1.5 && upperWick <= bodySize * 0.5;

  let analysis = "";

  if (!isDoji) {
    const isSimilar = Math.abs(upperWick - lowerWick) <= totalRange * 0.1;

    analysis += "1️⃣ 꼬리 길이 비교 \n";

    if (isSimilar) {
      analysis +=
        "윗꼬리와 아랫꼬리가 비슷합니다. \n 매수·매도 세력이 균형을 이뤘을 가능성이 있습니다. \n";
    } else {
      if (upperWick > lowerWick) {
        analysis +=
          "윗꼬리가 더 깁니다. \n 장중에 매수세가 있었지만, 종가에 가까워지며 매도 압력이 컸던 것으로 보입니다. \n";
        analysis += isBullish
          ? "약한 상승폭을 보였습니다. \n"
          : "강한 하락폭을 보였습니다. \n";
      } else {
        analysis += "아랫꼬리가 더 깁니다. \n";
        if (isBullish) {
          if (isLogLowerWick) {
            analysis +=
              "장중에 매도세가 있었지만, 이후 강한 매수세가 들어와 강한 상승폭을 보였습니다. \n 저점이라면, 저가 매수세가 유입하여 반등 가능성, 지지선 확인 후 상승 전환 시도로 볼 수 있습니다. \n";
          } else {
            analysis +=
              "장중에 매도세가 있었지만, 이후 매수세가 들어와 상승했습니다. \n";
          }
        } else {
          analysis +=
            "장중에 매도세가 있었지만, 매수세가 들어와 저가보다는 오른채 마감했습니다.\n";
        }
      }
    }

    analysis += "\n 2️⃣ 몸통 크기 비교 \n";
    if (bodyRatio > 0.7) {
      analysis += `종가가 시가와 크게 벌어졌습니다. \n 몸통이 크고 꼬리가 짧은 강한 추세형 캔들입니다. \n`;

      if (isBullish) {
        analysis +=
          "매수세가 힘을 잃지 않고 장을 끝까지 주도했습니다. \n 다음 날도 흐름이 이어질 가능성이 높습니다.";
      } else {
        // todo. else 케이스 더 추가할 필요 있음
        if (upperWick < lowerWick) {
          analysis +=
            "하락 의지가 강한 음봉입니다. \n 매도세가 강했고, 추가 하락 가능성도 있습니다. \n 단, 아랫꼬리가 있다는 건 소폭 매수세 방어 시도도 있었음을 의미합니다.\n";
        }
      }
    } else if (bodyRatio > 0.4) {
      analysis += `몸통이 중간 크기이고 꼬리와 함께 방향성을 보여줍니다. \n`;
    } else {
      analysis += `몸통이 작고 꼬리가 긴 캔들입니다. \n 변동성에 비해 종가의 방향성이 약했습니다. \n`;
    }
  } else {
    // 십자형 도지
    const isStandardDoji = Math.abs(upperWick - lowerWick) <= totalRange * 0.1;
    // 비석형 도지
    const isGravestoneDoji =
      upperWick >= totalRange * 0.6 && lowerWick <= totalRange * 0.1;
    // 잠자리형 도지
    const isDragonflyDoji =
      upperWick <= totalRange * 0.1 && lowerWick >= totalRange * 0.6;

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
      <p style={{ margin: "10px 0" }}>{formattedDate}</p>
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
                height: ((upperWick / totalHeight) * 100).toFixed(2) + "%",
                backgroundColor: color,
              }}
            ></div>
            <div
              style={{
                width: "20px",
                height: ((bodySize / totalHeight) * 100).toFixed(2) + "%",
                backgroundColor: color,
              }}
            ></div>
            <div
              style={{
                width: "2px",
                height: ((lowerWick / totalHeight) * 100).toFixed(2) + "%",
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
            <div key={price.name}>
              <span className="text-gray-500">{price.name}: </span>
              <span className="ml-2 font-medium text-red-600">
                {price.formattedValue}
              </span>
            </div>
          ))}
        </div>
      </div>
      <div style={{ marginTop: "20px", whiteSpace: "pre-line" }}>
        {analysis}
      </div>

      <p
        style={{
          fontSize: "small",
          margin: "20px 0",
          textDecoration: "underline",
        }}
      >
        ❗️ 과거의 가격 흐름이 미래의 수익을 보장하지는 않습니다. 투자 판단의
        참고 자료로만 활용해 주세요.
      </p>
    </div>
  );
}

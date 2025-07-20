import { DateTime } from "luxon";

const formatPrice = (price: number, isUSD: boolean) => {
  return isUSD ? "$" + price.toLocaleString() : price.toLocaleString() + "원";
};

const getAnalysis = ({
  open,
  close,
  low,
  high,
}: Pick<CandleData, "open" | "close" | "low" | "high">): string => {
  const totalRange = high - low;
  const isDoji = Math.abs(open - close) <= totalRange * 0.01;
  const isBullish = !isDoji && close > open;
  const isBearish = !isDoji && close < open;

  const upperWick = high - Math.max(open, close);
  const lowerWick = Math.min(open, close) - low;

  const bodySize = Math.abs(open - close);
  const bodyRatio = bodySize / totalRange;

  const tailThreshold = totalRange * 0.1;
  const hasSignificantTailThreshold = totalRange * 0.3;
  const longTailThreshold = totalRange * 0.5;

  const hasNoUpperWick = upperWick <= tailThreshold;

  /**
   * 장대 몸통, 추세 주도성이 있음
   * 양봉 > 꾸준한 매수세
   * 음봉 > 꾸준한 매도세
   */
  const isLongBody = bodySize >= totalRange * 0.6;
  /**
   * 짧은 몸통
   * 방향성이 뚜렷하지 않음 (중립)
   */
  const isShortBody = bodySize <= totalRange * 0.4;

  /**
   * 장대 양봉 + 매수 주도형 케이스
   */
  if (isBullish && isLongBody && hasNoUpperWick) {
    return "장대 양봉 + 매수 주도형 양봉입니다. \n (아랫꼬리 짧음) 초반 눌림이 있어 소폭 하락했습니다. \n 하지만 곧바로 매수세가 유입되며 시가를 돌파했습니다. \n 종가=고가 -> 종가 직전까지 매수세가 꾸준히 이어졌습니다. \n 매수자들이 이익 실현을 거의 하지 않았고, 더 상승할 여지를 남겨뒀습니다. \n 추세 전환 초기 or 돌파 시점에 자주 나오는 캔들로, 다음날 갭 상승 또는 추가 상승 가능성이 있습니다. \n ";
  }

  /**
   * 장대 양봉 + 윗꼬리 & 아랫꼬리 모두 있는 매수 우위 캔들
   */
  if (
    isBullish &&
    isLongBody &&
    upperWick > tailThreshold &&
    lowerWick > tailThreshold
  ) {
    return "장대 양봉 + 윗꼬리 & 아랫꼬리 모두 있는 전형적인 매수 우위 캔들입니다.\n 일부 매도세가 유입되어 아랫꼬리가 형성되었습니다. \n 눌림 이후 매수세가 강하게 유입되며 반등했습니다. \n 고점 근접 후 일부 이익 실현이 이루어졌으나, 매수 주도로 상승 마감했습니다.\n 다음 날 추가 상승을 기대할 수 있는 긍정적 흐름입니다.\n";
  }

  /**
   * 짧은 양봉 + 아랫꼬리 긴 케이스
   */
  if (
    isBullish &&
    isShortBody &&
    lowerWick > longTailThreshold &&
    upperWick > tailThreshold
  ) {
    return "긴 아랫꼬리를 가진 짧은 양봉입니다.\n눌림 후 매수세가 유입되었으나, 매수세가 확실한 우위는 아닙니다.\n 방향성이 뚜렷하지 않습니다.\n 보합 내지 반등 가능성이 있으나, 다음 날 거래량 증가와 함께 고가 돌파 여부가 중요한 관건입니다.";
  }

  /**
   * 짧은 양봉 && 윗꼬리/아랫꼬리 모두 일정 비율 이상 존재
   */
  if (
    isBullish &&
    isShortBody &&
    lowerWick > hasSignificantTailThreshold &&
    upperWick > hasSignificantTailThreshold
  ) {
    return "상하 꼬리가 긴 중립 양봉입니다.\n 매수세가 존재하지만 뚜렷한 우위는 아닙니다. \n 시장 혼조 or 불확실한 조정 구간에서 자주 나타나는 패턴입니다.\n";
  }

  /**
   * 장대 음봉
   */
  if (isBearish && isLongBody && hasNoUpperWick && lowerWick > tailThreshold) {
    return "하락 지속형 약세 음봉입니다.\n 윗꼬리 없이 시가가 고점, 종가가 저점 근처라면, 매도세가 하루 종일 지속됐다는 의미입니다.\n아랫꼬리가 있으나 매수세가 강하지 않아 저점 부근 마감했습니다. \n다음 날 추가 하락 가능성도 열려 있습니다.\n 거래량이 많았다면 신뢰도가 높습니다. 적었다면 단기 조정일 수 있습니다.\n";
  }

  /**
   * 장대 음봉, 아랫 꼬리
   */
  if (
    isBearish &&
    upperWick < tailThreshold &&
    lowerWick > hasSignificantTailThreshold
  ) {
    return "매도 주도 음봉입니다.\n 장 초반 약간 상승했지만 곧바로 매도가 우세했습니다. \n 종가가 저점보단 높아, 하단 지지나 반등 시도가 있었다고 볼 수 있습니다.\n 하지만 전체적으로 하락 주도세가 뚜렷합니다.\n 다만, 눌림 반발 가능성이 약간 있습니다. 하단 지지 구간인지 여부가 중요합니다.";
  }

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
          if (lowerWick > longTailThreshold) {
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
    if (isLongBody) {
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

  return analysis;
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
  const isBearish = !isDoji && close < open;
  const isBullish = !isDoji && close > open;
  const color = isDoji ? "#dee2e6" : isBullish ? "#ED5858" : "#5889ED";

  const upperWick = high - Math.max(open, close);
  const lowerWick = Math.min(open, close) - low;
  const bodySize = Math.abs(open - close);
  const totalHeight = upperWick + lowerWick + bodySize;

  const analysis = getAnalysis({ open, close, low, high });

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

  const HIGHT_LIST = [
    {
      label: "윗꼬리",
      value: ((upperWick / totalHeight) * 100).toFixed(2) + "%",
    },
    {
      label: "몸통",
      value: ((bodySize / totalHeight) * 100).toFixed(2) + "%",
    },
    {
      label: "아랫꼬리",
      value: ((lowerWick / totalHeight) * 100).toFixed(2) + "%",
    },
  ];

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
                height: HIGHT_LIST[0].value,
                backgroundColor: color,
              }}
            ></div>
            <div
              style={{
                width: "20px",
                height: HIGHT_LIST[1].value,
                backgroundColor: color,
              }}
            ></div>
            <div
              style={{
                width: "2px",
                height: HIGHT_LIST[2].value,
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
        <div>
          {HIGHT_LIST.map((height) => (
            <div key={height.label}>
              <span className="text-gray-500">{height.label}: </span>
              <span className="ml-2 font-medium text-red-600">
                {height.value}
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

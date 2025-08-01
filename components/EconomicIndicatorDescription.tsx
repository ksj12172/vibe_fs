export default function EconomicIndicatorDescription({ indicatorInfo }: { indicatorInfo: IndicatorInfo }) {

  if (!indicatorInfo) return null;

  return (
    <div
    className="economic-data"
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
        {indicatorInfo.icon} {indicatorInfo.title}
      </h4>
      <div style={{ display: "grid", gap: "8px" }}>
        <div
            className="text-gray-700 leading-relaxed"
            dangerouslySetInnerHTML={{
              __html: indicatorInfo.description.replace(/\n/g, "<br />"),
            }}
          />
        <div>
          {indicatorInfo.details}
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
        💡 데이터 출처: {indicatorInfo.source}
      </div>
    </div>
  );
}
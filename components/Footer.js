"use client";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer
      style={{
        padding: "30px 0",
        backgroundColor: "#f8f9fa",
        color: "#666",
        textAlign: "center",
        fontSize: "12px",
      }}
    >
      <p>&copy; {currentYear} 재무제표 시각화. 투자 참고용 데이터입니다.</p>
    </footer>
  );
}

import "./globals.css";
import Header from "../components/Header";

export const metadata = {
  title: "재무제표 시각화",
  description: "한국 상장기업의 재무제표를 조회하고 분석해봐요.",
  viewport: "width=device-width, initial-scale=1",
  themeColor: "#667eea",
  // PWA 메타데이터
  manifestUrl: "/manifest.json",
  appleWebAppCapable: "yes",
  appleWebAppStatusBarStyle: "default",
  appleWebAppTitle: "재무제표 시각화",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#667eea" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="재무제표 시각화" />
      </head>
      <body>
        <Header />
        <div className="main-content">{children}</div>
      </body>
    </html>
  );
}

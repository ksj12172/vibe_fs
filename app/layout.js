import './globals.css';

export const metadata = {
  title: '재무제표 시각화',
  description: '한국 상장기업의 재무제표를 조회하고 분석해봐요.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}

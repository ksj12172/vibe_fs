import { NextResponse } from "next/server";

// API 라우트를 동적으로 렌더링하도록 강제 설정
export const dynamic = "force-dynamic";

export async function GET(request, { params }) {
  try {
    const { searchParams } = request.nextUrl;
    const stockCode = params.code;
    const forceRefresh = searchParams.get("force_refresh") === "true";

    if (!stockCode || stockCode.trim() === "") {
      return NextResponse.json(
        { error: "종목코드를 입력해주세요." },
        { status: 400 }
      );
    }

    // Python 서버 URL 설정 - 200일 데이터를 위해 충분한 기간 설정
    const pythonServerUrl =
      process.env.NODE_ENV === "development"
        ? `http://localhost:${process.env.NEXT_PUBLIC_PYTHON_API_PORT}/api/stock-data/${stockCode}/ma200?force_refresh=${forceRefresh}`
        : `/api/stock-data/${stockCode}/ma200?force_refresh=${forceRefresh}`;

    const response = await fetch(pythonServerUrl);

    if (!response.ok) {
      throw new Error("200일 평균 가격 데이터를 불러오지 못했습니다.");
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error("200일 평균 가격 데이터를 불러오지 못했습니다.");
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("200일 평균 가격 조회 오류:", error);
    return NextResponse.json(
      { error: "200일 평균 가격 조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

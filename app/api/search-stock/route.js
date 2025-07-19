import { NextResponse } from "next/server";
import { getPrismaClient } from "../../../lib/prisma";

// API 라우트를 동적으로 렌더링하도록 강제 설정
export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const { searchParams } = request.nextUrl;
    const query = searchParams.get("query");
    const market = searchParams.get("market"); // 'KR', 'US', 또는 빈 값 (전체)

    if (!query || query.trim() === "") {
      return NextResponse.json(
        { error: "검색어를 입력해주세요." },
        { status: 400 }
      );
    }

    // 데이터베이스 연결 확인
    if (!process.env.DATABASE_URL) {
      console.error("❌ DATABASE_URL 환경변수가 설정되지 않았습니다.");
      return NextResponse.json(
        { error: "데이터베이스 연결 설정이 필요합니다." },
        { status: 500 }
      );
    }

    const prisma = getPrismaClient();

    // 검색 조건 구성
    const searchCondition = {
      AND: [
        { isActive: true }, // 활성화된 주식만
        {
          OR: [
            { name: { contains: query.trim(), mode: "insensitive" } },
            { nameKor: { contains: query.trim(), mode: "insensitive" } },
            { nameEng: { contains: query.trim(), mode: "insensitive" } },
            { symbol: { contains: query.trim(), mode: "insensitive" } },
          ],
        },
      ],
    };

    // 마켓 필터 추가
    if (market && (market === "KR" || market === "US")) {
      searchCondition.AND.push({ market: market });
    }

    const stocks = await prisma.stock.findMany({
      where: searchCondition,
      select: {
        id: true,
        symbol: true,
        name: true,
        nameKor: true,
        nameEng: true,
        market: true,
        exchange: true,
        sector: true,
        industry: true,
        logo: true,
        currency: true,
      },
      orderBy: [
        { market: "asc" }, // KR이 먼저 오도록
        { name: "asc" },
      ],
      take: 20, // 검색 결과 제한
    });

    return NextResponse.json({
      success: true,
      results: stocks || [],
      total: stocks.length,
    });
  } catch (error) {
    console.error("주식 검색 오류:", error);

    // 더 구체적인 에러 메시지 제공
    if (error.code === "P1001") {
      return NextResponse.json(
        { error: "데이터베이스 연결에 실패했습니다." },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: "주식 검색 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

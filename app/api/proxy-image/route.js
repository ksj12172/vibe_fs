import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const imageUrl = searchParams.get("url");

    if (!imageUrl) {
      return NextResponse.json(
        { error: "URL parameter is required" },
        { status: 400 }
      );
    }

    // URL 검증 (기본적인 보안 체크)
    try {
      new URL(imageUrl);
    } catch {
      return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
    }

    // 허용된 도메인 체크 (선택사항 - 보안을 위해)
    const allowedDomains = [
      "images.unsplash.com",
      "via.placeholder.com",
      "picsum.photos",
      "media.brand.dev",
      "shinhanfp.kr",
      "www.lg.co.kr",
      // 필요한 도메인들 추가
    ];

    const imageUrlObj = new URL(imageUrl);
    const isAllowedDomain = allowedDomains.some(
      (domain) =>
        imageUrlObj.hostname === domain ||
        imageUrlObj.hostname.endsWith("." + domain)
    );

    // 모든 도메인 허용하려면 이 체크를 제거하세요
    if (!isAllowedDomain) {
      console.warn(`Blocked request to domain: ${imageUrlObj.hostname}`);
      return NextResponse.json(
        { error: "Domain not allowed" },
        { status: 403 }
      );
    }

    // 외부 이미지 가져오기
    const response = await fetch(imageUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; ImageProxy/1.0)",
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch image: ${response.status}` },
        { status: response.status }
      );
    }

    const contentType = response.headers.get("content-type");

    // 이미지 타입 체크
    if (!contentType || !contentType.startsWith("image/")) {
      return NextResponse.json(
        { error: "URL does not point to an image" },
        { status: 400 }
      );
    }

    const imageBuffer = await response.arrayBuffer();

    // 이미지 반환 (CORS 헤더 포함)
    return new NextResponse(imageBuffer, {
      headers: {
        "Content-Type": contentType,
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET",
        "Access-Control-Allow-Headers": "Content-Type",
        "Cache-Control": "public, max-age=3600", // 1시간 캐시
      },
    });
  } catch (error) {
    console.error("Proxy image error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// OPTIONS 요청 처리 (CORS preflight)
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

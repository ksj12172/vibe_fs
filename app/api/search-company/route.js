import { NextResponse } from 'next/server';
import { PostgresDatabaseManager } from '../../../lib/postgres-database';

// API 라우트를 동적으로 렌더링하도록 강제 설정
export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = request.nextUrl;
    const query = searchParams.get('query');

    if (!query || query.trim() === '') {
      return NextResponse.json(
        { error: '검색어를 입력해주세요.' },
        { status: 400 }
      );
    }

    // 데이터베이스 연결 확인
    if (!process.env.DATABASE_URL) {
      console.error('❌ DATABASE_URL 환경변수가 설정되지 않았습니다.');
      return NextResponse.json(
        { error: '데이터베이스 연결 설정이 필요합니다.' },
        { status: 500 }
      );
    }

    const db = new PostgresDatabaseManager();
    const results = await db.searchCompanies(query.trim());

    return NextResponse.json({
      success: true,
      results: results || [],
    });
  } catch (error) {
    console.error('회사 검색 오류:', error);

    // 더 구체적인 에러 메시지 제공
    if (error.code === 'P1001') {
      return NextResponse.json(
        { error: '데이터베이스 연결에 실패했습니다.' },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: '회사 검색 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

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

    const db = new PostgresDatabaseManager();
    const results = await db.searchCompanies(query.trim());

    return NextResponse.json({
      success: true,
      results: results || [],
    });
  } catch (error) {
    console.error('회사 검색 오류:', error);
    return NextResponse.json(
      { error: '회사 검색 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

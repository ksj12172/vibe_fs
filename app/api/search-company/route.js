import { NextResponse } from 'next/server';
import { getDatabase } from '../../../lib/database';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');

    if (!query || query.trim() === '') {
      return NextResponse.json(
        { error: '검색어를 입력해주세요.' },
        { status: 400 }
      );
    }

    const db = getDatabase();
    const results = db.searchCompanies(query.trim());

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

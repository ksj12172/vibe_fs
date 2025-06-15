import { NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const corp_code = searchParams.get('corp_code');
    const bsns_year = searchParams.get('bsns_year');
    const reprt_code = searchParams.get('reprt_code');

    if (!corp_code || !bsns_year || !reprt_code) {
      return NextResponse.json(
        {
          error:
            '필수 매개변수가 누락되었습니다. (corp_code, bsns_year, reprt_code)',
        },
        { status: 400 }
      );
    }

    const apiKey = process.env.DART_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API 키가 설정되지 않았습니다.' },
        { status: 500 }
      );
    }

    // Open DART API 호출
    const response = await axios.get(
      'https://opendart.fss.or.kr/api/fnlttSinglAcnt.json',
      {
        params: {
          crtfc_key: apiKey,
          corp_code: corp_code,
          bsns_year: bsns_year,
          reprt_code: reprt_code,
        },
        timeout: 10000,
      }
    );

    // API 응답 확인
    if (response.data.status !== '000') {
      return NextResponse.json(
        {
          error: `DART API 오류: ${response.data.message}`,
          status: response.data.status,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: response.data,
    });
  } catch (error) {
    console.error('재무제표 데이터 조회 오류:', error);

    if (error.response) {
      return NextResponse.json(
        { error: `API 요청 실패: ${error.response.status}` },
        { status: error.response.status }
      );
    } else if (error.code === 'ECONNABORTED') {
      return NextResponse.json(
        { error: '요청 시간이 초과되었습니다.' },
        { status: 408 }
      );
    } else {
      return NextResponse.json(
        { error: '서버 오류가 발생했습니다.' },
        { status: 500 }
      );
    }
  }
}

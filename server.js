require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { PostgresDatabaseManager } = require('./lib/postgres-database');

const app = express();
const PORT = process.env.PORT || 3000;

// 데이터베이스 초기화
let dbManager;
try {
  dbManager = new PostgresDatabaseManager();
  console.log('✅ PostgreSQL 데이터베이스 연결 준비 완료');
} catch (error) {
  console.error('❌ 데이터베이스 연결 실패:', error.message);
  process.exit(1);
}

// 미들웨어
app.use(cors());
app.use(express.json());
app.use(express.static('public')); // 정적 파일 서빙

// 회사 검색 API
app.get('/api/search-company', async (req, res) => {
  try {
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({ error: '검색어를 입력해주세요.' });
    }

    // 데이터베이스에서 회사 검색
    const searchResults = await dbManager.searchCompanies(query, 10);

    res.json({
      success: true,
      results: searchResults.map((company) => ({
        corp_code: company.corp_code,
        corp_name: company.corp_name,
        stock_code: company.stock_code || '',
        corp_eng_name: company.corp_eng_name || '',
      })),
    });
  } catch (error) {
    console.error('회사 검색 오류:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

// 재무제표 데이터 가져오기 API
app.get('/api/financial-data', async (req, res) => {
  try {
    const { corp_code, bsns_year, reprt_code } = req.query;

    if (!corp_code || !bsns_year || !reprt_code) {
      return res.status(400).json({
        error:
          '필수 매개변수가 누락되었습니다. (corp_code, bsns_year, reprt_code)',
      });
    }

    const apiKey = process.env.DART_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'API 키가 설정되지 않았습니다.' });
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
      return res.status(400).json({
        error: `DART API 오류: ${response.data.message}`,
        status: response.data.status,
      });
    }

    res.json({
      success: true,
      data: response.data,
    });
  } catch (error) {
    console.error('재무제표 데이터 조회 오류:', error);

    if (error.response) {
      res.status(error.response.status).json({
        error: `API 요청 실패: ${error.response.status}`,
      });
    } else if (error.code === 'ECONNABORTED') {
      res.status(408).json({ error: '요청 시간이 초과되었습니다.' });
    } else {
      res.status(500).json({ error: '서버 오류가 발생했습니다.' });
    }
  }
});

// 메인 페이지
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 서버 시작
app.listen(PORT, async () => {
  console.log(
    `🚀 재무제표 시각화 서버가 http://localhost:${PORT}에서 실행 중입니다.`
  );
  console.log(`📊 웹 브라우저에서 http://localhost:${PORT}를 열어보세요.`);

  // 데이터베이스 상태 정보 출력
  try {
    const stats = await dbManager.getStats();
    if (stats) {
      console.log(
        `📦 데이터베이스: ${stats.total}개 회사 (상장회사: ${stats.listed}개) - ${stats.dbType}`
      );
    }
  } catch (error) {
    console.log(
      '📦 데이터베이스 상태를 확인할 수 없습니다. 마이그레이션이 필요할 수 있습니다.'
    );
  }
});

// 프로세스 종료 시 데이터베이스 연결 정리
process.on('SIGINT', () => {
  console.log('\n🔄 서버 종료 중...');
  if (dbManager) {
    dbManager.close();
    console.log('✅ 데이터베이스 연결 종료');
  }
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🔄 서버 종료 중...');
  if (dbManager) {
    dbManager.close();
    console.log('✅ 데이터베이스 연결 종료');
  }
  process.exit(0);
});

module.exports = app;

const { sql } = require('@vercel/postgres');

class PostgresDatabaseManager {
  constructor() {
    // Vercel Postgres는 자동으로 환경변수에서 연결 정보를 가져옵니다
  }

  // 테이블 생성
  async createTable() {
    try {
      await sql`
        CREATE TABLE IF NOT EXISTS companies (
          id SERIAL PRIMARY KEY,
          corp_code VARCHAR(8) UNIQUE NOT NULL,
          corp_name VARCHAR(255) NOT NULL,
          corp_eng_name VARCHAR(255),
          stock_code VARCHAR(6),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `;

      // 인덱스 생성
      await sql`CREATE INDEX IF NOT EXISTS idx_corp_name ON companies(corp_name)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_corp_code ON companies(corp_code)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_stock_code ON companies(stock_code)`;

      console.log('✅ PostgreSQL 테이블 및 인덱스 생성 완료');
    } catch (error) {
      console.error('❌ 테이블 생성 오류:', error);
      throw error;
    }
  }

  // 회사 검색
  async searchCompanies(query, limit = 10) {
    try {
      const searchQuery = `%${query}%`;
      const exactQuery = `${query}%`;

      const result = await sql`
        SELECT corp_code, corp_name, corp_eng_name, stock_code 
        FROM companies 
        WHERE corp_name LIKE ${searchQuery}
        ORDER BY 
          CASE 
            WHEN corp_name LIKE ${exactQuery} THEN 1
            WHEN corp_name LIKE ${searchQuery} THEN 2
            ELSE 3
          END,
          corp_name
        LIMIT ${limit}
      `;

      return result.rows;
    } catch (error) {
      console.error('❌ 회사 검색 오류:', error);
      throw error;
    }
  }

  // 회사코드로 회사 정보 조회
  async getCompanyByCode(corpCode) {
    try {
      const result = await sql`
        SELECT * FROM companies WHERE corp_code = ${corpCode}
      `;

      return result.rows[0] || null;
    } catch (error) {
      console.error('❌ 회사 정보 조회 오류:', error);
      throw error;
    }
  }

  // 회사 데이터 일괄 삽입 (안전한 방식으로 개선)
  async insertCompanies(companies) {
    try {
      // 기존 데이터 삭제
      await sql`DELETE FROM companies`;
      console.log('🗑️  기존 데이터 정리 완료');

      // 배치 삽입
      const batchSize = 500; // 배치 크기 줄임 (안정성 향상)
      let insertedCount = 0;

      for (let i = 0; i < companies.length; i += batchSize) {
        const batch = companies.slice(i, i + batchSize);

        // 안전한 배치 삽입 (prepared statement 방식)
        const insertPromises = batch.map(
          (company) =>
            sql`
            INSERT INTO companies (corp_code, corp_name, corp_eng_name, stock_code)
            VALUES (
              ${company.corp_code || ''}, 
              ${company.corp_name || ''}, 
              ${company.corp_eng_name || ''}, 
              ${company.stock_code || ''}
            )
            ON CONFLICT (corp_code) DO UPDATE SET
              corp_name = EXCLUDED.corp_name,
              corp_eng_name = EXCLUDED.corp_eng_name,
              stock_code = EXCLUDED.stock_code
          `
        );

        await Promise.all(insertPromises);

        insertedCount += batch.length;
        console.log(
          `📊 진행률: ${insertedCount}/${companies.length} (${(
            (insertedCount / companies.length) *
            100
          ).toFixed(1)}%)`
        );
      }

      console.log(`✅ 총 ${insertedCount}개 회사 데이터 삽입 완료`);
      return insertedCount;
    } catch (error) {
      console.error('❌ 데이터 삽입 오류:', error);
      throw error;
    }
  }

  // 데이터베이스 상태 확인
  async getStats() {
    try {
      const totalResult = await sql`SELECT COUNT(*) as count FROM companies`;
      const listedResult = await sql`
        SELECT COUNT(*) as count FROM companies 
        WHERE stock_code IS NOT NULL AND stock_code != '' AND stock_code != ' '
      `;

      return {
        total: parseInt(totalResult.rows[0].count),
        listed: parseInt(listedResult.rows[0].count),
        dbType: 'PostgreSQL',
      };
    } catch (error) {
      console.error('❌ 통계 조회 오류:', error);
      return null;
    }
  }

  // 연결 종료 (Vercel Postgres는 자동 관리되므로 불필요)
  close() {
    // PostgreSQL 연결은 Vercel에서 자동 관리
    console.log('PostgreSQL 연결은 Vercel에서 자동 관리됩니다.');
  }
}

module.exports = { PostgresDatabaseManager };

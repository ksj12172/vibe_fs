const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

class DatabaseManager {
  constructor() {
    // 데이터베이스 파일 경로
    this.dbPath = path.join(__dirname, 'data', 'companies.db');

    // data 폴더 생성
    const dataDir = path.dirname(this.dbPath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    // 데이터베이스 연결
    this.db = new Database(this.dbPath);

    // WAL 모드 설정 (성능 향상)
    this.db.pragma('journal_mode = WAL');
  }

  // 테이블 생성
  createTables() {
    console.log('📋 데이터베이스 테이블 생성 중...');

    const createCompaniesTable = `
      CREATE TABLE IF NOT EXISTS companies (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        corp_code TEXT UNIQUE NOT NULL,
        corp_name TEXT NOT NULL,
        corp_eng_name TEXT,
        stock_code TEXT,
        modify_date TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;

    const createIndexes = [
      'CREATE INDEX IF NOT EXISTS idx_corp_code ON companies(corp_code)',
      'CREATE INDEX IF NOT EXISTS idx_corp_name ON companies(corp_name)',
      'CREATE INDEX IF NOT EXISTS idx_stock_code ON companies(stock_code)',
    ];

    try {
      this.db.exec(createCompaniesTable);
      createIndexes.forEach((index) => this.db.exec(index));
      console.log('✅ 테이블 및 인덱스 생성 완료');
    } catch (error) {
      console.error('❌ 테이블 생성 중 오류:', error.message);
      throw error;
    }
  }

  // JSON 데이터를 데이터베이스로 마이그레이션
  async migrateFromJSON() {
    const jsonPath = path.join(__dirname, 'downloads', 'corpCodes.json');

    if (!fs.existsSync(jsonPath)) {
      console.error('❌ corpCodes.json 파일을 찾을 수 없습니다.');
      console.log(
        '💡 먼저 "yarn download" 명령어로 회사코드를 다운로드해주세요.'
      );
      return false;
    }

    try {
      console.log('🔄 JSON 데이터를 데이터베이스로 마이그레이션 중...');

      // JSON 파일 읽기
      const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
      const companies = Array.isArray(jsonData.result.list)
        ? jsonData.result.list
        : [jsonData.result.list];

      // 기존 데이터 삭제
      this.db.exec('DELETE FROM companies');
      console.log('🗑️  기존 데이터 정리 완료');

      // 테이블 존재 여부 확인
      const tableExists = this.db
        .prepare(
          `
        SELECT name FROM sqlite_master WHERE type='table' AND name='companies'
      `
        )
        .get();

      if (!tableExists) {
        throw new Error('companies 테이블이 존재하지 않습니다');
      }

      // 배치 삽입을 위한 prepared statement
      const insertStatement = this.db.prepare(`
        INSERT OR REPLACE INTO companies (
          corp_code, corp_name, corp_eng_name, stock_code, modify_date
        ) VALUES (?, ?, ?, ?, ?)
      `);

      // 트랜잭션으로 일괄 처리
      const insertMany = this.db.transaction((companies) => {
        for (const company of companies) {
          insertStatement.run(
            company.corp_code || '',
            company.corp_name || '',
            company.corp_eng_name || '',
            company.stock_code || '',
            company.modify_date || ''
          );
        }
      });

      // 데이터 삽입 실행
      insertMany(companies);

      // 결과 확인
      const count = this.db
        .prepare('SELECT COUNT(*) as count FROM companies')
        .get();
      const listedCount = this.db
        .prepare(
          "SELECT COUNT(*) as count FROM companies WHERE stock_code IS NOT NULL AND stock_code != '' AND stock_code != ' '"
        )
        .get();

      console.log('✅ 데이터 마이그레이션 완료!');
      console.log(`📊 총 회사 수: ${count.count}개`);
      console.log(`📈 상장회사 수: ${listedCount.count}개`);

      return true;
    } catch (error) {
      console.error('❌ 마이그레이션 중 오류 발생:', error.message);
      return false;
    }
  }

  // 회사 검색
  searchCompanies(query, limit = 10) {
    const searchStatement = this.db.prepare(`
      SELECT corp_code, corp_name, corp_eng_name, stock_code 
      FROM companies 
      WHERE corp_name LIKE ? 
      ORDER BY 
        CASE 
          WHEN corp_name LIKE ? THEN 1
          WHEN corp_name LIKE ? THEN 2
          ELSE 3
        END,
        corp_name
      LIMIT ?
    `);

    const searchQuery = `%${query}%`;
    const exactQuery = `${query}%`;

    return searchStatement.all(searchQuery, exactQuery, searchQuery, limit);
  }

  // 회사코드로 회사 정보 조회
  getCompanyByCode(corpCode) {
    const statement = this.db.prepare(`
      SELECT * FROM companies WHERE corp_code = ?
    `);

    return statement.get(corpCode);
  }

  // 데이터베이스 연결 종료
  close() {
    this.db.close();
  }

  // 데이터베이스 상태 확인
  getStats() {
    try {
      const totalCount = this.db
        .prepare('SELECT COUNT(*) as count FROM companies')
        .get();
      const listedCount = this.db
        .prepare(
          "SELECT COUNT(*) as count FROM companies WHERE stock_code IS NOT NULL AND stock_code != '' AND stock_code != ' '"
        )
        .get();

      return {
        total: totalCount.count,
        listed: listedCount.count,
        dbSize: fs.statSync(this.dbPath).size,
      };
    } catch (error) {
      return null;
    }
  }
}

// 스크립트 실행
async function setupDatabase() {
  console.log('🚀 데이터베이스 설정 시작...');

  const dbManager = new DatabaseManager();

  try {
    // 1. 테이블 생성
    dbManager.createTables();

    // 2. JSON 데이터 마이그레이션
    const migrationSuccess = await dbManager.migrateFromJSON();

    if (migrationSuccess) {
      // 3. 상태 확인
      const stats = dbManager.getStats();
      if (stats) {
        console.log('\n📊 데이터베이스 상태:');
        console.log(`📁 파일 위치: ${dbManager.dbPath}`);
        console.log(`📦 파일 크기: ${(stats.dbSize / 1024).toFixed(2)} KB`);
        console.log(`🏢 총 회사 수: ${stats.total}개`);
        console.log(`📈 상장회사 수: ${stats.listed}개`);
      }

      console.log('\n✅ 데이터베이스 설정 완료!');
      console.log('💡 이제 "yarn start" 명령어로 서버를 시작할 수 있습니다.');
    }
  } catch (error) {
    console.error('❌ 데이터베이스 설정 중 오류:', error.message);
  } finally {
    dbManager.close();
  }
}

// 모듈로 내보내기
module.exports = DatabaseManager;

// 직접 실행 시
if (require.main === module) {
  setupDatabase();
}

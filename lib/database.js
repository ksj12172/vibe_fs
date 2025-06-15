const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

class DatabaseManager {
  constructor() {
    // 데이터베이스 파일 경로
    this.dbPath = path.join(process.cwd(), 'data', 'companies.db');

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
    if (this.db) {
      this.db.close();
    }
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

// 싱글톤 인스턴스
let dbInstance = null;

function getDatabase() {
  if (!dbInstance) {
    dbInstance = new DatabaseManager();
  }
  return dbInstance;
}

module.exports = { DatabaseManager, getDatabase };

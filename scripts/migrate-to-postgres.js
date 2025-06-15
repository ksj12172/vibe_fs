const { PostgresDatabaseManager } = require('../lib/postgres-database');
const fs = require('fs');
const path = require('path');

async function setupPostgresDatabase() {
  console.log('🚀 PostgreSQL 데이터베이스 설정 시작...');

  try {
    // PostgreSQL 데이터베이스 설정
    console.log('🔧 PostgreSQL 테이블 생성 중...');
    const postgresDb = new PostgresDatabaseManager();
    await postgresDb.createTable();

    // JSON 파일에서 데이터 읽기
    const jsonPath = path.join(__dirname, '..', 'downloads', 'corpCodes.json');

    if (!fs.existsSync(jsonPath)) {
      console.error('❌ corpCodes.json 파일을 찾을 수 없습니다.');
      console.log(
        '💡 먼저 "yarn download" 명령어로 회사코드를 다운로드해주세요.'
      );
      return false;
    }

    console.log('📖 JSON 파일에서 데이터 읽는 중...');
    const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    const companies = Array.isArray(jsonData.result.list)
      ? jsonData.result.list
      : [jsonData.result.list];

    console.log(`📊 총 ${companies.length}개의 회사 데이터를 찾았습니다.`);

    // 데이터 마이그레이션
    console.log('📤 PostgreSQL로 데이터 삽입 중...');
    await postgresDb.insertCompanies(companies);

    // 설정 결과 확인
    console.log('✅ 설정 결과 확인 중...');
    const stats = await postgresDb.getStats();

    console.log('\n🎉 PostgreSQL 데이터베이스 설정 완료!');
    console.log(`📊 총 회사 수: ${stats.total}`);
    console.log(`📈 상장 회사 수: ${stats.listed}`);
    console.log(`💾 데이터베이스 타입: ${stats.dbType}`);

    return true;
  } catch (error) {
    console.error('❌ 데이터베이스 설정 오류:', error);
    return false;
  }
}

// 스크립트 실행
if (require.main === module) {
  setupPostgresDatabase()
    .then((success) => {
      if (success) {
        console.log('✅ 데이터베이스 설정 완료');
        console.log('💡 이제 "yarn start" 명령어로 서버를 시작할 수 있습니다.');
      } else {
        console.log('❌ 데이터베이스 설정 실패');
      }
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error('❌ 설정 실패:', error);
      process.exit(1);
    });
}

module.exports = { setupPostgresDatabase };

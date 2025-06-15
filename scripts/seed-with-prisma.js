const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function seedDatabase() {
  console.log('🚀 Prisma를 사용한 데이터베이스 시딩 시작...');

  try {
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

    // 기존 데이터 삭제
    console.log('🗑️  기존 데이터 정리 중...');
    await prisma.company.deleteMany();
    console.log('✅ 기존 데이터 정리 완료');

    // 배치 삽입
    const batchSize = 500;
    let insertedCount = 0;

    for (let i = 0; i < companies.length; i += batchSize) {
      const batch = companies.slice(i, i + batchSize);

      // Prisma를 사용한 배치 삽입
      const insertData = batch.map((company) => ({
        corpCode: company.corp_code || '',
        corpName: company.corp_name || '',
        corpEngName: company.corp_eng_name || null,
        stockCode: company.stock_code || null,
      }));

      await prisma.company.createMany({
        data: insertData,
        skipDuplicates: true,
      });

      insertedCount += batch.length;
      console.log(
        `📊 진행률: ${insertedCount}/${companies.length} (${(
          (insertedCount / companies.length) *
          100
        ).toFixed(1)}%)`
      );
    }

    // 결과 확인
    const totalCount = await prisma.company.count();
    const listedCount = await prisma.company.count({
      where: {
        AND: [
          { stockCode: { not: null } },
          { stockCode: { not: '' } },
          { stockCode: { not: ' ' } },
        ],
      },
    });

    console.log('\n🎉 Prisma 데이터베이스 시딩 완료!');
    console.log(`📊 총 회사 수: ${totalCount}`);
    console.log(`📈 상장 회사 수: ${listedCount}`);
    console.log(`💾 데이터베이스 타입: PostgreSQL (Prisma)`);

    return true;
  } catch (error) {
    console.error('❌ 데이터베이스 시딩 오류:', error);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

// 개별 회사 데이터 삽입 함수 (예시)
async function insertSingleCompany(companyData) {
  try {
    const company = await prisma.company.create({
      data: {
        corpCode: companyData.corp_code,
        corpName: companyData.corp_name,
        corpEngName: companyData.corp_eng_name || null,
        stockCode: companyData.stock_code || null,
      },
    });
    console.log('✅ 회사 데이터 삽입 완료:', company.corpName);
    return company;
  } catch (error) {
    console.error('❌ 회사 데이터 삽입 오류:', error);
    throw error;
  }
}

// 회사 검색 함수 (예시)
async function searchCompanies(query, limit = 10) {
  try {
    const companies = await prisma.company.findMany({
      where: {
        OR: [
          { corpName: { contains: query } },
          { corpEngName: { contains: query } },
          { stockCode: { contains: query } },
        ],
      },
      orderBy: [
        {
          corpName: 'asc',
        },
      ],
      take: limit,
    });
    return companies;
  } catch (error) {
    console.error('❌ 회사 검색 오류:', error);
    throw error;
  }
}

// 스크립트 실행
if (require.main === module) {
  seedDatabase()
    .then((success) => {
      if (success) {
        console.log('✅ 데이터베이스 시딩 완료');
        console.log('💡 이제 "yarn dev" 명령어로 서버를 시작할 수 있습니다.');
      } else {
        console.log('❌ 데이터베이스 시딩 실패');
      }
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error('❌ 시딩 실패:', error);
      process.exit(1);
    });
}

module.exports = {
  seedDatabase,
  insertSingleCompany,
  searchCompanies,
};

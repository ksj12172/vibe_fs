import { getPrismaClient } from '../lib/prisma';

class PostgresDatabaseManager {
  constructor() {
    // Prisma 클라이언트를 사용하여 데이터베이스 연결을 관리합니다
  }

  // 테이블 생성 - Prisma Migrate를 사용하므로 불필요하지만 호환성을 위해 유지
  async createTable() {
    try {
      // Prisma는 schema.prisma 파일을 기반으로 마이그레이션을 통해 테이블을 생성합니다
      // 이 메서드는 호환성을 위해 유지하지만 실제로는 prisma migrate를 사용해야 합니다
      console.log(
        '✅ Prisma를 사용한 테이블 관리 - schema.prisma 및 마이그레이션을 확인하세요'
      );
    } catch (error) {
      console.error('❌ 테이블 생성 오류:', error);
      throw error;
    }
  }

  // 회사 검색
  async searchCompanies(query, limit = 10) {
    try {
      const prisma = getPrismaClient();
      const companies = await prisma.company.findMany({
        where: {
          OR: [
            { corpName: { contains: query, mode: 'insensitive' } },
            { corpEngName: { contains: query, mode: 'insensitive' } },
            { stockCode: { contains: query, mode: 'insensitive' } },
          ],
        },
        select: {
          corpCode: true,
          corpName: true,
          corpEngName: true,
          stockCode: true,
        },
        orderBy: {
          corpName: 'asc',
        },
        take: limit,
      });

      // 검색 결과를 기존 형식에 맞게 변환
      return companies.map((company) => ({
        corp_code: company.corpCode,
        corp_name: company.corpName,
        corp_eng_name: company.corpEngName,
        stock_code: company.stockCode,
      }));
    } catch (error) {
      console.error('❌ 회사 검색 오류:', error);
      throw error;
    }
  }

  // 회사코드로 회사 정보 조회
  async getCompanyByCode(corpCode) {
    try {
      const prisma = getPrismaClient();
      const company = await prisma.company.findUnique({
        where: {
          corpCode: corpCode,
        },
      });

      if (!company) {
        return null;
      }

      // 기존 형식에 맞게 변환
      return {
        id: company.id,
        corp_code: company.corpCode,
        corp_name: company.corpName,
        corp_eng_name: company.corpEngName,
        stock_code: company.stockCode,
        created_at: company.createdAt,
      };
    } catch (error) {
      console.error('❌ 회사 정보 조회 오류:', error);
      throw error;
    }
  }

  // 회사 데이터 일괄 삽입
  async insertCompanies(companies) {
    try {
      const prisma = getPrismaClient();
      // 기존 데이터 삭제
      await prisma.company.deleteMany();
      console.log('🗑️  기존 데이터 정리 완료');

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
      const prisma = getPrismaClient();
      const total = await prisma.company.count();
      const listed = await prisma.company.count({
        where: {
          AND: [
            { stockCode: { not: null } },
            { stockCode: { not: '' } },
            { stockCode: { not: ' ' } },
          ],
        },
      });

      return {
        total: total,
        listed: listed,
        dbType: 'PostgreSQL (Prisma)',
      };
    } catch (error) {
      console.error('❌ 통계 조회 오류:', error);
      return null;
    }
  }

  // 연결 종료
  async close() {
    try {
      const prisma = getPrismaClient();
      await prisma.$disconnect();
      console.log('✅ Prisma 연결이 정상적으로 종료되었습니다.');
    } catch (error) {
      console.error('❌ Prisma 연결 종료 오류:', error);
    }
  }
}

module.exports = { PostgresDatabaseManager };

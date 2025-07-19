import { getPrismaClient } from "../lib/prisma";

async function addETFData() {
  const prisma = getPrismaClient();

  try {
    console.log("📊 ETF 데이터 추가 중...");

    const etfData = [
      // KODEX ETF
      {
        symbol: "069500",
        name: "KODEX 200",
        nameKor: "KODEX 200",
        nameEng: "KODEX KOSPI 200",
        type: "ETF",
        market: "KR",
        exchange: "KOSPI",
        sector: "ETF",
        industry: "Index ETF",
        description: "KOSPI 200 지수를 추종하는 ETF",
        currency: "KRW",
        isActive: true,
      },
      // TIGER ETF
      {
        symbol: "102110",
        name: "TIGER 200",
        nameKor: "TIGER 200",
        nameEng: "TIGER KOSPI 200",
        type: "ETF",
        market: "KR",
        exchange: "KOSPI",
        sector: "ETF",
        industry: "Index ETF",
        description: "KOSPI 200 지수를 추종하는 ETF",
        currency: "KRW",
        isActive: true,
      },
      {
        symbol: "371160",
        name: "TIGER 차이나항셍테크",
        nameKor: "TIGER 차이나항셍테크",
        nameEng: "TIGER China Hang Seng TECH",
        type: "ETF",
        market: "KR",
        exchange: "KOSPI",
        sector: "ETF",
        industry: "China Tech ETF",
        description: "항셍 테크놀로지 지수를 추종하는 ETF",
        currency: "KRW",
        isActive: true,
      },
      {
        symbol: "143850",
        name: "TIGER 미국나스닥100",
        nameKor: "TIGER 미국나스닥100",
        nameEng: "TIGER NASDAQ 100",
        type: "ETF",
        market: "KR",
        exchange: "KOSPI",
        sector: "ETF",
        industry: "US Tech ETF",
        description: "나스닥 100 지수를 추종하는 ETF",
        currency: "KRW",
        isActive: true,
      },
      {
        symbol: "360750",
        name: "TIGER 미국S&P500",
        nameKor: "TIGER 미국S&P500",
        nameEng: "TIGER S&P 500",
        type: "ETF",
        market: "KR",
        exchange: "KOSPI",
        sector: "ETF",
        industry: "US Index ETF",
        description: "S&P 500 지수를 추종하는 ETF",
        currency: "KRW",
        isActive: true,
      },
      // KBSTAR ETF
      {
        symbol: "148020",
        name: "KBSTAR 200",
        nameKor: "KBSTAR 200",
        nameEng: "KBSTAR KOSPI 200",
        type: "ETF",
        market: "KR",
        exchange: "KOSPI",
        sector: "ETF",
        industry: "Index ETF",
        description: "KOSPI 200 지수를 추종하는 ETF",
        currency: "KRW",
        isActive: true,
      },
      // ARIRANG ETF
      {
        symbol: "152100",
        name: "ARIRANG 200",
        nameKor: "ARIRANG 200",
        nameEng: "ARIRANG KOSPI 200",
        type: "ETF",
        market: "KR",
        exchange: "KOSPI",
        sector: "ETF",
        industry: "Index ETF",
        description: "KOSPI 200 지수를 추종하는 ETF",
        currency: "KRW",
        isActive: true,
      },
    ];

    await prisma.stock.createMany({
      data: etfData,
      skipDuplicates: true,
    });

    console.log(`✅ ${etfData.length}개의 ETF 데이터 추가 완료!`);
  } catch (error) {
    console.error("❌ ETF 데이터 추가 오류:", error);
    throw error;
  }
}

async function addETNData() {
  const prisma = getPrismaClient();

  try {
    console.log("📈 ETN 데이터 추가 중...");

    const etnData = [
      {
        symbol: "500044",
        name: "KB WTI원유선물ETN",
        nameKor: "KB WTI원유선물ETN",
        nameEng: "KB WTI Crude Oil Futures ETN",
        type: "ETN",
        market: "KR",
        exchange: "KOSPI",
        sector: "ETN",
        industry: "Commodity ETN",
        description: "WTI 원유 선물 가격을 추종하는 ETN",
        currency: "KRW",
        isActive: true,
      },
      {
        symbol: "225040",
        name: "KODEX 인버스",
        nameKor: "KODEX 인버스",
        nameEng: "KODEX KOSPI 200 Inverse",
        type: "ETN",
        market: "KR",
        exchange: "KOSPI",
        sector: "ETN",
        industry: "Inverse ETN",
        description: "KOSPI 200 지수의 역방향 수익률을 추종하는 ETN",
        currency: "KRW",
        isActive: true,
      },
      {
        symbol: "225050",
        name: "KODEX 레버리지",
        nameKor: "KODEX 레버리지",
        nameEng: "KODEX KOSPI 200 Leverage",
        type: "ETN",
        market: "KR",
        exchange: "KOSPI",
        sector: "ETN",
        industry: "Leverage ETN",
        description: "KOSPI 200 지수의 2배 수익률을 추종하는 ETN",
        currency: "KRW",
        isActive: true,
      },
    ];

    await prisma.stock.createMany({
      data: etnData,
      skipDuplicates: true,
    });

    console.log(`✅ ${etnData.length}개의 ETN 데이터 추가 완료!`);
  } catch (error) {
    console.error("❌ ETN 데이터 추가 오류:", error);
    throw error;
  }
}

async function addPreferredStockData() {
  const prisma = getPrismaClient();

  try {
    console.log("💎 우선주 데이터 추가 중...");

    const preferredData = [
      {
        symbol: "005935",
        name: "삼성전자우",
        nameKor: "삼성전자우",
        nameEng: "Samsung Electronics Co., Ltd. Preferred",
        type: "PREFERRED",
        market: "KR",
        exchange: "KOSPI",
        sector: "Technology",
        industry: "Consumer Electronics",
        description: "삼성전자 우선주",
        currency: "KRW",
        isActive: true,
      },
      {
        symbol: "051915",
        name: "LG화학우",
        nameKor: "LG화학우",
        nameEng: "LG Chem, Ltd. Preferred",
        type: "PREFERRED",
        market: "KR",
        exchange: "KOSPI",
        sector: "Basic Materials",
        industry: "Chemicals",
        description: "LG화학 우선주",
        currency: "KRW",
        isActive: true,
      },
      {
        symbol: "000815",
        name: "삼성화재우",
        nameKor: "삼성화재우",
        nameEng: "Samsung Fire & Marine Insurance Preferred",
        type: "PREFERRED",
        market: "KR",
        exchange: "KOSPI",
        sector: "Financial Services",
        industry: "Insurance",
        description: "삼성화재해상보험 우선주",
        currency: "KRW",
        isActive: true,
      },
    ];

    await prisma.stock.createMany({
      data: preferredData,
      skipDuplicates: true,
    });

    console.log(`✅ ${preferredData.length}개의 우선주 데이터 추가 완료!`);
  } catch (error) {
    console.error("❌ 우선주 데이터 추가 오류:", error);
    throw error;
  }
}

// 스크립트 실행
async function main() {
  const prisma = getPrismaClient();

  try {
    await addETFData();
    await addETNData();
    await addPreferredStockData();

    // 통계 확인
    const totalCount = await prisma.stock.count();
    const stockCount = await prisma.stock.count({ where: { type: "STOCK" } });
    const etfCount = await prisma.stock.count({ where: { type: "ETF" } });
    const etnCount = await prisma.stock.count({ where: { type: "ETN" } });
    const preferredCount = await prisma.stock.count({
      where: { type: "PREFERRED" },
    });

    console.log("\n📊 Stock 테이블 현황:");
    console.log(`- 총 개수: ${totalCount}`);
    console.log(`- 일반주식: ${stockCount}`);
    console.log(`- ETF: ${etfCount}`);
    console.log(`- ETN: ${etnCount}`);
    console.log(`- 우선주: ${preferredCount}`);

    console.log("\n🎉 모든 데이터 추가가 완료되었습니다!");
    console.log("\n💡 이제 다음 검색어들을 테스트해보세요:");
    console.log('   - "TIGER" → ETF 검색');
    console.log('   - "KODEX" → ETF/ETN 검색');
    console.log('   - "삼성전자우" → 우선주 검색');
    console.log('   - "ETF" → 모든 ETF 검색');
  } catch (error) {
    console.error("💥 데이터 추가 실패:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// 스크립트 실행
main();

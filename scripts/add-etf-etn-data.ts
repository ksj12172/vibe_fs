import { PrismaClient } from "@prisma/client";

async function addETFData() {
  const prisma = new PrismaClient();

  try {
    console.log("📊 ETF 데이터 추가 중...");

    const etfData = [
      {
        symbol: "161510",
        name: "PLUS 고배당주",
        nameKor: "PLUS 고배당주",
        nameEng: "ARIRANG Dividend ETF",
        type: "ETF",
        market: "KR",
        exchange: "KOSPI",
        sector: "ETF",
        industry: "Index ETF",
        description: "예상 배당수익률 상위 30종목 선정하여 투자",
        currency: "KRW",
        isActive: true,
        website: "https://www.plusetf.co.kr/product/detail?n=006273",
      },
      {
        symbol: "466940",
        name: "TIGER 은행고배당플러스TOP10",
        nameKor: "TIGER 은행고배당플러스TOP10",
        nameEng: "Mirae Asset Tiger Bank High Dividend Plus Top 10 Fn Etf",
        type: "ETF",
        market: "KR",
        exchange: "KOSPI",
        sector: "ETF",
        industry: "Index ETF",
        description: "고배당에 최적화된 은행주 포트폴리오의 등장!",
        currency: "KRW",
        isActive: true,
        website:
          "https://www.tigeretf.com/ko/product/search/detail/index.do?ksdFund=KR7466940004",
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
  const prisma = new PrismaClient();

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
  const prisma = new PrismaClient();

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
  const prisma = new PrismaClient();

  try {
    await addETFData();
    // await addETNData();
    // await addPreferredStockData();

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

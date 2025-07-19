import { getPrismaClient } from "../lib/prisma";

async function migrateCompanyToStock() {
  const prisma = getPrismaClient();

  try {
    console.log("🚀 Company → Stock 마이그레이션 시작...");

    // 1. 상장된 회사들만 조회 (stock_code가 있는 회사들)
    const listedCompanies = await prisma.company.findMany({
      where: {
        AND: [
          { stockCode: { not: null } },
          { stockCode: { not: "" } },
          { stockCode: { not: " " } },
        ],
      },
    });

    console.log(
      `📊 총 ${listedCompanies.length}개의 상장 회사를 발견했습니다.`
    );

    // 2. Stock 테이블 초기화
    await prisma.stock.deleteMany();
    console.log("🗑️  기존 Stock 데이터 정리 완료");

    // 3. Company → Stock 변환
    const stockData = listedCompanies.map((company) => ({
      symbol: company.stockCode!,
      name: company.corpName,
      nameKor: company.corpName, // 한국 회사이므로 한글명으로 설정
      nameEng: company.corpEngName || null,
      market: "KR" as const, // 기본적으로 한국 시장으로 설정
      exchange: null, // 나중에 수동으로 KOSPI/KOSDAQ 설정 필요
      sector: company.sector || null,
      industry: company.industry || null,
      description: company.description || null,
      logo: company.logo || null,
      website: company.website || null,
      currency: "KRW",
      isActive: true,
    }));

    // 4. 배치 삽입
    const batchSize = 500;
    let insertedCount = 0;

    for (let i = 0; i < stockData.length; i += batchSize) {
      const batch = stockData.slice(i, i + batchSize);

      await prisma.stock.createMany({
        data: batch,
        skipDuplicates: true,
      });

      insertedCount += batch.length;
      console.log(
        `📈 진행률: ${insertedCount}/${stockData.length} (${(
          (insertedCount / stockData.length) *
          100
        ).toFixed(1)}%)`
      );
    }

    console.log(
      `✅ 총 ${insertedCount}개의 주식 데이터를 Stock 테이블에 삽입 완료!`
    );

    // 5. 통계 확인
    const stockCount = await prisma.stock.count();
    const krStockCount = await prisma.stock.count({ where: { market: "KR" } });

    console.log("\n📊 마이그레이션 결과:");
    console.log(`- 총 주식 수: ${stockCount}`);
    console.log(`- 한국 주식: ${krStockCount}`);
    console.log(`- 미국 주식: ${stockCount - krStockCount}`);
  } catch (error) {
    console.error("❌ 마이그레이션 오류:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// 샘플 미국 주식 데이터 추가 함수
async function addUSStockSamples() {
  const prisma = getPrismaClient();

  try {
    console.log("🇺🇸 미국 주식 샘플 데이터 추가 중...");

    const usStocks = [
      {
        symbol: "AAPL",
        name: "Apple Inc.",
        nameKor: "애플",
        nameEng: "Apple Inc.",
        market: "US" as const,
        exchange: "NASDAQ",
        sector: "Technology",
        industry: "Consumer Electronics",
        description:
          "Apple Inc. designs, manufactures, and markets smartphones, personal computers, tablets, wearables, and accessories worldwide.",
        currency: "USD",
        isActive: true,
      },
      {
        symbol: "MSFT",
        name: "Microsoft Corporation",
        nameKor: "마이크로소프트",
        nameEng: "Microsoft Corporation",
        market: "US" as const,
        exchange: "NASDAQ",
        sector: "Technology",
        industry: "Software",
        description:
          "Microsoft Corporation develops, licenses, and supports software, services, devices, and solutions worldwide.",
        currency: "USD",
        isActive: true,
      },
      {
        symbol: "GOOGL",
        name: "Alphabet Inc.",
        nameKor: "알파벳",
        nameEng: "Alphabet Inc.",
        market: "US" as const,
        exchange: "NASDAQ",
        sector: "Technology",
        industry: "Internet Content & Information",
        description:
          "Alphabet Inc. provides online advertising services in the United States, Europe, the Middle East, Africa, the Asia-Pacific, Canada, and Latin America.",
        currency: "USD",
        isActive: true,
      },
      {
        symbol: "TSLA",
        name: "Tesla, Inc.",
        nameKor: "테슬라",
        nameEng: "Tesla, Inc.",
        market: "US" as const,
        exchange: "NASDAQ",
        sector: "Consumer Cyclical",
        industry: "Auto Manufacturers",
        description:
          "Tesla, Inc. designs, develops, manufactures, leases, and sells electric vehicles, and energy generation and storage systems in the United States, China, and internationally.",
        currency: "USD",
        isActive: true,
      },
      {
        symbol: "AMZN",
        name: "Amazon.com, Inc.",
        nameKor: "아마존",
        nameEng: "Amazon.com, Inc.",
        market: "US" as const,
        exchange: "NASDAQ",
        sector: "Consumer Cyclical",
        industry: "Internet Retail",
        description:
          "Amazon.com, Inc. engages in the retail sale of consumer products and subscriptions in North America and internationally.",
        currency: "USD",
        isActive: true,
      },
    ];

    await prisma.stock.createMany({
      data: usStocks,
      skipDuplicates: true,
    });

    console.log(`✅ ${usStocks.length}개의 미국 주식 샘플 데이터 추가 완료!`);
  } catch (error) {
    console.error("❌ 미국 주식 샘플 추가 오류:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// 스크립트 실행
async function main() {
  try {
    await migrateCompanyToStock();
    await addUSStockSamples();
    console.log("\n🎉 모든 마이그레이션이 완료되었습니다!");
    console.log(
      "\n💡 이제 http://localhost:3000 에서 주식 검색을 테스트해보세요!"
    );
    console.log('   - "삼성" 검색 → 한국 주식 결과');
    console.log('   - "애플" 또는 "Apple" 검색 → 미국 주식 결과');
    console.log("   - 마켓 필터로 한국/미국 주식 분리 가능");
  } catch (error) {
    console.error("💥 마이그레이션 실패:", error);
    process.exit(1);
  }
}

// 스크립트 실행
main();

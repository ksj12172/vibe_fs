const { PrismaClient } = require("@prisma/client");

async function updateSamsungPreferredStock() {
  const prisma = new PrismaClient();

  try {
    console.log("🔍 데이터 확인 중...");

    // 현재 삼성전자우 데이터 확인
    const existing = await prisma.stock.findUnique({
      where: { symbol: "133690" },
    });

    if (existing) {
      console.log("📋 현재 정보:");
      console.log(`   - 심볼: ${existing.symbol}`);
      console.log(`   - 한글명: ${existing.nameKor}`);
      console.log(`   - 현재 영문명: ${existing.nameEng}`);
      console.log(`   - 타입: ${existing.type}`);
      console.log(`   - 설명: ${existing.description}`);

      // 업데이트
      const updated = await prisma.stock.update({
        where: { symbol: "133690" },
        data: {
          symbol: "133690",
          name: "TIGER 미국나스닥100",
          nameKor: "TIGER 미국나스닥100",
          nameEng: "Mirae Asset TIGER USA NASDAQ 100 ETF",
          description:
            "4차 산업혁명의 수혜가 기대되는 IT, 소비재, 헬스케어 중심으로 구성된 미국 나스닥 시장 분산 투자합니다.",
          website:
            "https://www.tigeretf.com/ko/product/search/detail/index.do?ksdFund=KR7133690008",
        },
      });

      console.log("\n✅ 업데이트 완료!");
      console.log(`변경 후: ${JSON.stringify(updated)}`);
    } else {
      console.log("❌ 데이터를 찾을 수 없습니다.");
      console.log("💡 먼저 add-etf-etn-data.ts 스크립트를 실행해주세요.");
    }
  } catch (error) {
    console.error("❌ 업데이트 오류:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// 스크립트 실행
updateSamsungPreferredStock();

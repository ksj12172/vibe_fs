const { PrismaClient } = require("@prisma/client");

async function updateSamsungPreferredStock() {
  const prisma = new PrismaClient();

  try {
    console.log("🔍 데이터 확인 중...");

    // 현재 삼성전자우 데이터 확인
    const existing = await prisma.stock.findUnique({
      where: { symbol: "360750" },
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
        where: { symbol: "360750" },
        data: {
          website:
            "https://www.tigeretf.com/ko/product/search/detail/index.do?ksdFund=KR7360750004",
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

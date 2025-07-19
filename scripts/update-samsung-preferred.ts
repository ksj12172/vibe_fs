const { PrismaClient } = require("@prisma/client");

async function updateSamsungPreferredStock() {
  const prisma = new PrismaClient();

  try {
    console.log("🔍 데이터 확인 중...");

    // 현재 삼성전자우 데이터 확인
    const existing = await prisma.stock.findUnique({
      where: { symbol: "371160" },
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
        where: { symbol: "371160" },
        data: {
          description:
            '<div>TIGER 차이나 항셍테크 ETF는 홍콩 증권거래소에 상장된 중국의 대표적인 혁신 기술 기업 30개에 투자하는 상장지수펀드입니다. <br />이 ETF는 Hang Seng TECH 지수를 기초지수로 추종하며, 알리바바, 텐센트, 샤오미, 메이퇀 등 중국의 주요 빅테크 기업들을 포함하여 중국 기술 부문의 성장성에 투자할 수 있는 기회를 제공합니다. <br/>중국 주식 시장 구조에 대한 설명과, 중국 기술주 ETF에 대한 추가 설명이 필요하다면 아래 링크를 참조해주세요.<br/ ><a href="https://ksj12172.tistory.com/1531" target="_blank">tistory 블로그: 중국 주식 시장 구조 이해하기, 중국 기술주 ETF</a></div>',
          website:
            "https://www.tigeretf.com/ko/product/search/detail/index.do?ksdFund=KR7371160003",
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

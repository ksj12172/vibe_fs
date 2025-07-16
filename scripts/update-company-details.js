const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const path = require("path");

const prisma = new PrismaClient();

async function updateCompanyDetails() {
  try {
    // company.json 파일 읽기
    const companyDataPath = path.join(__dirname, "../lib/company.json");
    const companyData = JSON.parse(fs.readFileSync(companyDataPath, "utf8"));

    console.log("Starting company details update...");
    console.log(
      `Found ${Object.keys(companyData).length} companies in company.json`
    );

    let updatedCount = 0;
    let createdCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const [stockCode, details] of Object.entries(companyData)) {
      try {
        console.log(`\nProcessing ${stockCode}...`);

        // stockCode로 기존 회사 찾기
        const existingCompany = await prisma.company.findFirst({
          where: { stockCode: stockCode },
        });

        const updateData = {
          description: details.description || null,
          website: details.website || null,
          sector: details.sector || null,
          industry: details.industry || null,
          founded: details.founded || null,
          headquarters: details.headquarters || null,
          logo: details.logo || null,
        };

        if (existingCompany) {
          // 기존 회사 정보 업데이트
          await prisma.company.update({
            where: { id: existingCompany.id },
            data: updateData,
          });
          updatedCount++;
          console.log(`✓ Updated: ${stockCode} - ${existingCompany.corpName}`);
        } else {
          // 새로운 회사 생성
          // corpCode가 없으므로 stockCode를 corpCode로 사용하거나 임시 값 설정
          // const corpName = details.description
          //   ? details.description.replace(/<[^>]*>/g, "").substring(0, 50) +
          //     "..."
          //   : `Company ${stockCode}`;

          // const newCompany = await prisma.company.create({
          //   data: {
          //     corpCode: `TEMP${stockCode}`, // 임시 corpCode (나중에 수정 필요)
          //     corpName: corpName,
          //     corpEngName: null,
          //     stockCode: stockCode,
          //     ...updateData,
          //   },
          // });
          // createdCount++;
          console.log("없는 회사");
        }
      } catch (error) {
        errorCount++;
        console.error(`✗ Error processing ${stockCode}:`, error.message);

        // 만약 corpCode 중복 에러라면 다른 방법 시도
        if (
          error.code === "P2002" &&
          error.meta?.target?.includes("corp_code")
        ) {
          try {
            const randomSuffix = Math.random().toString(36).substring(2, 6);
            const newCompany = await prisma.company.create({
              data: {
                corpCode: `TMP${stockCode}${randomSuffix}`,
                corpName: `Company ${stockCode}`,
                corpEngName: null,
                stockCode: stockCode,
                ...updateData,
              },
            });
            createdCount++;
            console.log(
              `✓ Created with random corpCode: ${stockCode} - ${newCompany.corpName}`
            );
          } catch (retryError) {
            console.error(
              `✗ Retry failed for ${stockCode}:`,
              retryError.message
            );
          }
        }
      }
    }

    console.log("\n=== Update Summary ===");
    console.log(`Updated existing companies: ${updatedCount}`);
    console.log(`Created new companies: ${createdCount}`);
    console.log(`Skipped: ${skippedCount}`);
    console.log(`Errors: ${errorCount}`);

    if (createdCount > 0) {
      console.log("\n⚠ Important Notes:");
      console.log(
        "- New companies were created with temporary corpCode values"
      );
      console.log(
        "- Please update the corpCode values manually to match official corporate codes"
      );
      console.log(
        "- You can find the official corporate codes from DART (https://dart.fss.or.kr)"
      );
    }
  } catch (error) {
    console.error("Error updating company details:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// 기존 회사들의 corpCode만 업데이트하는 함수
async function updateExistingOnly() {
  try {
    const companyDataPath = path.join(__dirname, "../lib/company.json");
    const companyData = JSON.parse(fs.readFileSync(companyDataPath, "utf8"));

    console.log("Updating existing companies only...");

    let updatedCount = 0;
    let notFoundCount = 0;

    for (const [stockCode, details] of Object.entries(companyData)) {
      const existingCompany = await prisma.company.findFirst({
        where: { stockCode: stockCode },
      });

      if (existingCompany) {
        await prisma.company.update({
          where: { id: existingCompany.id },
          data: {
            description: details.description || existingCompany.description,
            website: details.website || existingCompany.website,
            sector: details.sector || existingCompany.sector,
            industry: details.industry || existingCompany.industry,
            founded: details.founded || existingCompany.founded,
            headquarters: details.headquarters || existingCompany.headquarters,
            logo: details.logo || existingCompany.logo,
          },
        });
        updatedCount++;
        console.log(`✓ Updated: ${stockCode} - ${existingCompany.corpName}`);
      } else {
        notFoundCount++;
        console.log(`⚠ Not found: ${stockCode}`);
      }
    }

    console.log(`\nUpdated: ${updatedCount}, Not found: ${notFoundCount}`);
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// 스크립트 실행
if (require.main === module) {
  const mode = process.argv[2];
  if (mode === "--existing-only") {
    updateExistingOnly();
  } else {
    updateCompanyDetails();
  }
}

module.exports = { updateCompanyDetails, updateExistingOnly };

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function updateCompanyDetails() {
  try {
    // company.json 파일 읽기
    const companyDataPath = path.join(__dirname, '../lib/company.json');
    const companyData = JSON.parse(fs.readFileSync(companyDataPath, 'utf8'));

    console.log('Starting company details update...');
    console.log(
      `Found ${Object.keys(companyData).length} companies in company.json`
    );

    let updatedCount = 0;
    let notFoundCount = 0;
    let newlyCreatedCount = 0;

    for (const [stockCode, details] of Object.entries(companyData)) {
      try {
        // stockCode로 기존 회사 찾기
        const existingCompany = await prisma.company.findFirst({
          where: { stockCode: stockCode },
        });

        if (existingCompany) {
          // 기존 회사 정보 업데이트
          await prisma.company.update({
            where: { id: existingCompany.id },
            data: {
              description: details.description || null,
              website: details.website || null,
              sector: details.sector || null,
              industry: details.industry || null,
              founded: details.founded || null,
              headquarters: details.headquarters || null,
              logo: details.logo || null,
            },
          });
          updatedCount++;
          console.log(`✓ Updated: ${stockCode} - ${existingCompany.corpName}`);
        } else {
          // stockCode로 회사를 찾을 수 없는 경우
          // 필요하다면 새로 생성 (corpCode 없이는 제약조건 때문에 어려울 수 있음)
          console.log(`⚠ Not found in DB: ${stockCode}`);
          notFoundCount++;
        }
      } catch (error) {
        console.error(`Error processing ${stockCode}:`, error.message);
      }
    }

    console.log('\n=== Update Summary ===');
    console.log(`Updated: ${updatedCount}`);
    console.log(`Not found: ${notFoundCount}`);
    console.log(`Newly created: ${newlyCreatedCount}`);
  } catch (error) {
    console.error('Error updating company details:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// 스크립트 실행
if (require.main === module) {
  updateCompanyDetails();
}

module.exports = { updateCompanyDetails };

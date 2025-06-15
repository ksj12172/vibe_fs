require('dotenv').config();
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');
const xml2js = require('xml2js');

async function downloadCorpCode() {
  try {
    // .env 파일에서 API 키 읽기 (OPENAI_API_KEY를 DART API 키로 사용)
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      console.error('❌ API 키가 설정되지 않았습니다.');
      console.log('💡 .env 파일에서 OPENAI_API_KEY를 설정해주세요.');
      return;
    }

    console.log('🚀 Open DART API로 회사코드 파일 다운로드 시작...');

    // Open DART API URL
    const url = 'https://opendart.fss.or.kr/api/corpCode.xml';

    // API 요청
    const response = await axios({
      method: 'GET',
      url: url,
      params: {
        crtfc_key: apiKey,
      },
      responseType: 'arraybuffer', // ZIP 파일을 받기 위해 arraybuffer 사용
      timeout: 30000, // 30초 타임아웃
    });

    // 응답 상태 확인
    if (response.status === 200) {
      // 다운로드 폴더 생성
      const downloadDir = './downloads';
      if (!fs.existsSync(downloadDir)) {
        fs.mkdirSync(downloadDir);
      }

      // 파일명 생성 (현재 날짜 포함)
      const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
      const fileName = `corpCode_${today}.zip`;
      const filePath = path.join(downloadDir, fileName);

      // 파일 저장
      fs.writeFileSync(filePath, response.data);

      console.log('✅ 회사코드 파일 다운로드 완료!');
      console.log(`📁 파일 위치: ${filePath}`);
      console.log(
        `📊 파일 크기: ${(fs.statSync(filePath).size / 1024).toFixed(2)} KB`
      );

      // ZIP 파일 압축 해제 및 JSON 파싱
      await extractAndParseToJSON(filePath, downloadDir, today);

      // ZIP 파일 제거
      fs.unlinkSync(filePath);
      console.log(`🗑️  ZIP 파일 제거 완료: ${fileName}`);

      // ZIP 파일 정보 출력
      console.log('\n📋 다운로드된 파일 정보:');
      console.log('- 고유번호 (corp_code): 공시대상회사의 고유번호(8자리)');
      console.log('- 정식명칭 (corp_name): 정식회사명칭');
      console.log('- 영문명칭 (corp_eng_name): 영문정식회사명칭');
      console.log('- 종목코드 (stock_code): 상장회사 주식 종목코드(6자리)');
      console.log('- 최종변경일자 (modify_date): 기업개황정보 최종변경일자');
    } else {
      console.error('❌ API 요청 실패:', response.status);
    }
  } catch (error) {
    console.error('❌ 오류 발생:', error.message);

    if (error.response) {
      // API 응답 오류 처리
      const status = error.response.status;
      const data = error.response.data;

      console.log('\n🔍 오류 상세 정보:');
      console.log(`HTTP 상태 코드: ${status}`);

      // Open DART API 오류 메시지 매핑
      if (data && data.includes) {
        if (data.includes('010')) {
          console.log('오류: 등록되지 않은 키입니다.');
        } else if (data.includes('011')) {
          console.log('오류: 사용할 수 없는 키입니다.');
        } else if (data.includes('012')) {
          console.log('오류: 접근할 수 없는 IP입니다.');
        } else if (data.includes('020')) {
          console.log('오류: 요청 제한을 초과하였습니다.');
        } else if (data.includes('800')) {
          console.log('오류: 시스템 점검 중입니다.');
        }
      }
    } else if (error.code === 'ENOTFOUND') {
      console.log('❌ 네트워크 연결을 확인해주세요.');
    } else if (error.code === 'ECONNABORTED') {
      console.log('❌ 요청 시간이 초과되었습니다.');
    }

    console.log('\n💡 해결 방법:');
    console.log('1. .env 파일의 OPENAI_API_KEY가 유효한 DART API 키인지 확인');
    console.log('2. 네트워크 연결 상태 확인');
    console.log('3. API 키 등록 및 IP 제한 설정 확인');
  }
}

// ZIP 파일 압축 해제 및 JSON 파싱 함수
async function extractAndParseToJSON(zipFilePath, downloadDir, dateString) {
  try {
    console.log('\n🔄 ZIP 파일 압축 해제 중...');

    // ZIP 파일 압축 해제
    const zip = new AdmZip(zipFilePath);
    const zipEntries = zip.getEntries();

    if (zipEntries.length === 0) {
      console.error('❌ ZIP 파일이 비어있습니다.');
      return;
    }

    // XML 파일 찾기 (보통 CORPCODE.xml)
    const xmlEntry = zipEntries.find(
      (entry) =>
        entry.entryName.toLowerCase().includes('corpcode') &&
        entry.entryName.toLowerCase().endsWith('.xml')
    );

    if (!xmlEntry) {
      console.error('❌ XML 파일을 찾을 수 없습니다.');
      console.log(
        '📋 ZIP 파일 내용:',
        zipEntries.map((e) => e.entryName)
      );
      return;
    }

    console.log(`📄 XML 파일 발견: ${xmlEntry.entryName}`);

    // XML 내용 추출
    const xmlContent = xmlEntry.getData().toString('utf8');

    console.log('🔄 XML을 JSON으로 파싱 중...');

    // XML을 JSON으로 파싱
    const parser = new xml2js.Parser({
      explicitArray: false,
      mergeAttrs: true,
      trim: true,
    });

    const result = await parser.parseStringPromise(xmlContent);

    // JSON 파일로 저장
    const jsonFileName = `corpCodes.json`;
    const jsonFilePath = path.join(downloadDir, jsonFileName);

    fs.writeFileSync(jsonFilePath, JSON.stringify(result, null, 2), 'utf8');

    console.log('✅ JSON 파싱 완료!');
    console.log(`📁 JSON 파일 위치: ${jsonFilePath}`);
    console.log(
      `📊 JSON 파일 크기: ${(fs.statSync(jsonFilePath).size / 1024).toFixed(
        2
      )} KB`
    );

    // 회사 수 정보 출력
    if (result && result.result && result.result.list) {
      const companies = Array.isArray(result.result.list)
        ? result.result.list
        : [result.result.list];
      console.log(`🏢 총 회사 수: ${companies.length}개`);

      // 상장회사 수 카운트
      const listedCompanies = companies.filter(
        (company) => company.stock_code && company.stock_code.trim() !== ''
      );
      console.log(`📈 상장회사 수: ${listedCompanies.length}개`);
    }
  } catch (error) {
    console.error('❌ ZIP 파일 처리 중 오류 발생:', error.message);
  }
}

// 스크립트 실행
if (require.main === module) {
  downloadCorpCode();
}

module.exports = { downloadCorpCode, extractAndParseToJSON };

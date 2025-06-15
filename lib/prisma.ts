import { PrismaClient } from '@prisma/client';

declare global {
  var prisma: PrismaClient | null | undefined;
}

let prisma: PrismaClient | null;

// Vercel 배포 시 빌드 타임에 데이터베이스 연결 시도를 방지
function createPrismaClient(): PrismaClient | null {
  try {
    // 환경변수 확인
    if (!process.env.DATABASE_URL) {
      console.warn('⚠️  DATABASE_URL이 설정되지 않았습니다.');
      return null;
    }

    const client = new PrismaClient({
      log:
        process.env.NODE_ENV === 'development'
          ? ['query', 'error', 'warn']
          : ['error'],
    });

    return client;
  } catch (error) {
    console.error('❌ Prisma 클라이언트 생성 오류:', error);
    return null;
  }
}

if (process.env.NODE_ENV === 'production') {
  prisma = createPrismaClient();
} else {
  if (!global.prisma) {
    global.prisma = createPrismaClient();
  }
  prisma = global.prisma || null;
}

// null 체크를 위한 함수
export function getPrismaClient(): PrismaClient {
  if (!prisma) {
    throw new Error(
      'Prisma 클라이언트가 초기화되지 않았습니다. DATABASE_URL을 확인해주세요.'
    );
  }
  return prisma;
}

export default prisma;

// import 는 파일 본문보다 먼저 실행되므로, DATABASE_URL 을 읽기 전에 여기서 .env 를 불러옵니다.
import 'dotenv/config';
import { PrismaClient } from '../../generated/prisma/client.ts';
import { PrismaPg } from '@prisma/adapter-pg';

// Prisma 7부터 DB 드라이버(pg)를 어댑터로 연결합니다.
// timezone=UTC: DB 세션 시간대가 Asia/Seoul이면 시간이 9시간 어긋나므로 UTC로 고정
const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
    options: '-c timezone=UTC',
});

export const prisma = new PrismaClient({ adapter });

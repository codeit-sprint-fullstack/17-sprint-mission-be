import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

// Prisma 7부터 DB 주소는 schema.prisma가 아닌 이곳에서 지정합니다.
export default defineConfig({
    schema: 'prisma/schema.prisma',
    migrations: {
        seed: 'node ./seeding/seed.js',
    },
    datasource: {
        url: env('DATABASE_URL'),
    },
});

import "dotenv/config";
import { defineConfig, env } from "prisma/config";

// Prisma 설정 (Prisma 7부터 DB 주소는 schema.prisma가 아닌 이곳에서 지정)
// - dotenv/config : .env 파일의 값을 process.env에 등록
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "node ./prisma/seed.js",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});

import { app } from "./app.js";
import { prisma } from "./src/db.js";

const port = Number(process.env.PORT || 3001);
if (!process.env.DATABASE_URL) {
  console.error("server/.env에 DATABASE_URL을 설정해 주세요.");
  process.exit(1);
}

try {
  await prisma.$connect();
  const server = app.listen(port, () => console.log(`판다마켓 서버를 시작했습니다. 포트 ${port}`));
  const close = () => server.close(() => prisma.$disconnect());
  process.once("SIGINT", close);
  process.once("SIGTERM", close);
} catch {
  console.error("PostgreSQL 연결을 확인해 주세요.");
  process.exitCode = 1;
  await prisma.$disconnect();
}

import "dotenv/config";
import app from "./app.js";
import { sequelize, syncDatabase } from "./db.js";
import "./models/index.js";

const port = Number(process.env.PORT) || 3001;

try {
  await syncDatabase();
  console.log("PostgreSQL에 연결했습니다.");
  const server = app.listen(port, () => console.log(`API 서버 실행 중: http://localhost:${port}`));

  for (const signal of ["SIGINT", "SIGTERM"]) {
    process.on(signal, () => server.close(async () => {
      await sequelize.close();
      process.exit(0);
    }));
  }
} catch (error) {
  console.error("서버를 시작하지 못했습니다.", error);
  process.exit(1);
}

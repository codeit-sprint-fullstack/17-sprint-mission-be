import express from "express";
import "dotenv/config";
import { dbConnect } from "./config/dbConnect.js";

const app = express();
const port = process.env.PORT || 3000;

//테스트용 health API
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

//MongoDB 연결 후 Express 서버 실행
async function startServer() {
  try {
    await dbConnect();

    app.listen(port, () => {
      console.log(`Listening on http://localhost:${port}`);
    });
  } catch (error) {
    console.error("Server startup failed:", error.message);
    process.exit(1);
  }
}

startServer();

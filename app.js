import cors from "cors";
import express from "express";
import { DatabaseError, ForeignKeyConstraintError, ValidationError } from "sequelize";
import { createCommentsRouter, commentsRouter } from "./routes/comments.js";
import { articlesRouter } from "./routes/articles.js";
import { productsRouter } from "./routes/products.js";

const app = express();
const allowedOrigins = (process.env.CLIENT_ORIGIN ?? "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({ origin: allowedOrigins }));
app.use(express.json({ limit: "1mb" }));
app.use("/api/products/:parentId/comments", createCommentsRouter("product"));
app.use("/api/articles/:parentId/comments", createCommentsRouter("article"));
app.use("/api/products", productsRouter);
app.use("/api/articles", articlesRouter);
app.use("/api/comments", commentsRouter);
app.get("/api/health", (_request, response) => response.json({ status: "ok" }));

app.use((_request, response) => response.status(404).json({ message: "요청한 경로를 찾을 수 없습니다." }));

app.use((error, _request, response, _next) => {
  if (error?.type === "entity.parse.failed") return response.status(400).json({ message: "요청 본문 JSON 형식이 올바르지 않습니다." });
  if (error instanceof ValidationError) {
    return response.status(400).json({ message: error.errors.map((item) => item.message).join(" ") });
  }
  if (error instanceof ForeignKeyConstraintError) {
    return response.status(409).json({ message: "연결된 데이터가 변경되어 요청을 처리할 수 없습니다." });
  }
  if (error instanceof DatabaseError && error.parent?.code === "23514") {
    return response.status(400).json({ message: "데이터 관계가 올바르지 않습니다." });
  }
  console.error(error);
  response.status(500).json({ message: "서버 오류가 발생했습니다." });
});

export default app;

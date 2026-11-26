import "dotenv/config";
import express from "express";
import cors from "cors";
import productRoutes from "./routes/productRoutes.js";
import articleRoutes from "./routes/articleRoutes.js";
import commentRoutes from "./routes/commentRoutes.js";
import { createHttpError, errorHandler } from "./middlewares/errorHandler.js";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.status(200).json({ message: "Panda Market API Server is running" });
});

app.use("/products", productRoutes);
app.use("/articles", articleRoutes);
app.use("/comments", commentRoutes);

// 등록되지 않은 경로 처리
app.use((req, res, next) => {
  next(createHttpError(404, "요청한 경로를 찾을 수 없습니다."));
});

// 공통 에러 핸들러
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});

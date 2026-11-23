import "dotenv/config";
import express from "express";
import cors from "cors";
import dbConnect from "./config/dbConnect.js";
import NotFoundError from "./exceptions/NotFoundError.js";
import errorHandler from "./middlewares/errorHandler.js";
import productRouter from "./routes/productRouter.js";

const app = express();
const PORT = process.env.PORT || 3000;

// 다른 주소(프론트엔드)에서 오는 요청 허용
app.use(cors());

// 요청 body의 JSON을 req.body 객체로 변환
app.use(express.json());

// MongoDB 연결
dbConnect();

// 서버 동작 확인 (GET /)
app.get("/", (req, res) => {
  res.send("판다마켓 API 서버");
});

// 상품 API (/products)
app.use("/products", productRouter);

// 없는 주소 → 404
app.use((req, res) => {
  throw new NotFoundError("요청한 주소를 찾을 수 없습니다.");
});

// 에러 응답 처리 (항상 맨 마지막)
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`서버 실행 중: http://localhost:${PORT}`);
});

import express from "express";
import "dotenv/config";
import { dbConnect } from "./config/dbConnect.js";
import Product from "./models/Product.js";

const app = express();
const port = process.env.PORT || 3000;
app.use(express.json());

//테스트용 health API
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.post("/api/products", async (req, res) => {
  const { name, description, price, tags } = req.body ?? {};

  //요청 데이터 검증
  if (
    typeof name !== "string" ||
    !name.trim() ||
    typeof description !== "string" ||
    !description.trim() ||
    typeof price !== "number" ||
    !Number.isFinite(price) ||
    price < 0 ||
    !Array.isArray(tags) ||
    !tags.every((tag) => typeof tag === "string")
  ) {
    return res.status(400).json({
      message: "올바른 상품 정보를 입력해 주세요.",
    });
  }

  try {
    //MongoDB에 상품 저장
    const product = await Product.create({
      name,
      description,
      price,
      tags,
    });
    return res.status(201).json(product);
  } catch (error) {
    console.error("상품 등록 실패:", error);
    return res.status(500).json({
      message: "상품 등록 중 서버 오류가 발생했습니다.",
    });
  }
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

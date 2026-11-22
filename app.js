import express from "express";
import "dotenv/config";
import { dbConnect } from "./config/dbConnect.js";
import Product from "./models/Product.js";
import mongoose from "mongoose";

const app = express();
const port = process.env.PORT || 3000;
app.use(express.json());

//테스트용 health API
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

//POST
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

//GET 상세조회
app.get("/api/products/:id", async (req, res) => {
  //URL에서 ID가져오기
  const { id } = req.params;
  //ObjectId 형식검사
  if (!mongoose.isObjectIdOrHexString(id)) {
    return res.status(400).json({
      message: "올바르지 않은 상품 ID입니다.",
    });
  }

  try {
    const product = await Product.findById(id);
    //해당 상품이 없는 경우
    if (!product) {
      return res.status(404).json({
        message: "상품을 찾을 수 없습니다.",
      });
    }
    //상세 조회 응답 데이터 구성
    const productDetail = {
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      tags: product.tags,
      createdAt: product.createdAt,
    };
    return res.status(200).json(productDetail);
  } catch (error) {
    console.error("상품 상세 조회 실패", error);
    return res.status(500).json({
      message: "상품 상세 조회 중 서버 오류가 발생했습니다.",
    });
  }
});

//GET 목록조회
app.get("/api/products", async (req, res) => {
  //요청 데이터 가져오기
  const {
    offset = "0",
    limit = "10",
    orderBy = "recent",
    keyword = "",
  } = req.query;
  //offset,limit 숫자 형식 검사
  if (
    typeof offset !== "string" ||
    !/^\d+$/.test(offset) ||
    typeof limit !== "string" ||
    !/^\d+$/.test(limit)
  ) {
    return res.status(400).json({
      message: "offset과 limit은 0 이상의 정수여야 합니다.",
    });
  }
  //문자열을 숫자로 변환
  const skip = Number(offset);
  const pageSize = Number(limit);
  //쿼리 파라미터 유효성 검사
  if (
    !Number.isSafeInteger(skip) ||
    !Number.isSafeInteger(pageSize) ||
    pageSize < 1 ||
    pageSize > 100 ||
    orderBy !== "recent" ||
    typeof keyword !== "string" ||
    keyword.length > 100
  ) {
    return res.status(400).json({
      message: "조회 조건이 올바르지 않습니다.",
    });
  }
  //검색조건 만들기
  const filter = {};
  if (keyword.trim()) {
    const escapedKeyword = keyword
      .trim()
      .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    filter.$or = [
      { name: { $regex: escapedKeyword, $options: "i" } },
      { description: { $regex: escapedKeyword, $options: "i" } },
    ];
  }
  //MongoDB 작업 및 오류 처리
  try {
    //검색, 최신순 정렬, 페이지네이션
    const products = await Product.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .skip(skip)
      .limit(pageSize);
    //검색 결과 전체 상품 개수
    const totalCount = await Product.countDocuments(filter);

    //목록 조회에 필요한 필드만 선택
    const list = products.map((product) => ({
      id: product.id,
      name: product.name,
      price: product.price,
      createdAt: product.createdAt,
    }));
    return res.status(200).json({
      list,
      totalCount,
    });
  } catch (error) {
    console.error("상품 목록 조회 실패", error);
    return res.status(500).json({
      message: "상품 목록 조회 중 서버 오류가 발생했습니다.",
    });
  }
});

//PATCH
app.patch("/api/products/:id", async (req, res) => {
  //URL에서 상품 ID 가져오기
  const { id } = req.params;

  //ObjectId 형식검사
  if (!mongoose.isObjectIdOrHexString(id)) {
    return res.status(400).json({
      message: "올바르지 않은 상품 ID입니다.",
    });
  }
  const { name, description, price, tags } = req.body ?? {};

  //수정할 필드만 모으기
  const updateData = {};

  if (name !== undefined) {
    updateData.name = name;
  }
  if (description !== undefined) {
    updateData.description = description;
  }
  if (price !== undefined) {
    updateData.price = price;
  }
  if (tags !== undefined) {
    updateData.tags = tags;
  }
  //수정할 데이터가 없는 경우
  if (Object.keys(updateData).length === 0) {
    return res.status(400).json({
      message: "수정할 상품 정보를 입력해 주세요.",
    });
  }
  //입력 데이터 유효성 검사
  if (
    (name !== undefined && (typeof name !== "string" || !name.trim())) ||
    (description !== undefined &&
      (typeof description !== "string" || !description.trim())) ||
    (price !== undefined &&
      (typeof price !== "number" || !Number.isFinite(price) || price < 0)) ||
    (tags !== undefined &&
      (!Array.isArray(tags) || !tags.every((tag) => typeof tag === "string")))
  ) {
    return res.status(400).json({
      message: "올바른 상품 정보를 입력해 주세요.",
    });
  }
  //MongoDB 상품 수정하기
  try {
    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      { $set: updateData },
      {
        new: true,
        runValidators: true,
      },
    );
    //상품을 찾을 수 없는 경우
    if (!updatedProduct) {
      return res.status(404).json({
        message: "상품을 찾을 수 없습니다.",
      });
    }
    //수정 성공
    return res.status(200).json(updatedProduct);
  } catch (error) {
    console.error("상품 수정 실패:", error);

    return res.status(500).json({
      message: "상품 수정 중 서버 오류가 발생했습니다.",
    });
  }
});

//DELETE
app.delete("/api/products/:id", async (req, res) => {
  const { id } = req.params;
  //ObjectId 형식검사
  if (!mongoose.isObjectIdOrHexString(id)) {
    return res.status(400).json({
      message: "올바르지 않은 상품 ID입니다.",
    });
  }
  try {
    //3.MongoDB에서 상품 삭제
    const deletedProduct = await Product.findByIdAndDelete(id);
    //4.상품이 없는 경우
    if (!deletedProduct) {
      return res.status(404).json({
        message: "상품을 찾을 수 없습니다.",
      });
    }
    //5.삭제성공
    return res.status(204).send();
  } catch (error) {
    console.error("상품 삭제 실패", error);

    return res.status(500).json({
      message: "상품 삭제 중 오류가 발생했습니다.",
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

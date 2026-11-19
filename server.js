require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const Product = require("./Product.js");

const app = express();
const port = process.env.PORT || 3001;

app.use(cors({ origin: process.env.FRONTEND_URL || "http://localhost:5173" }));
app.use(express.json());

app.get("/", (req, res) => {
  res.send("서버 연결 성공");
});

app.get("/products", async (req, res, next) => {
  const {
    offset = "0",
    limit = "10",
    keyword = "",
    orderBy = "recent",
  } = req.query;

  const skip = Number(offset);
  const size = Number(limit);

  if (
    typeof offset !== "string" ||
    !/^\d+$/.test(offset) ||
    !Number.isSafeInteger(skip) ||
    typeof limit !== "string" ||
    !/^\d+$/.test(limit) ||
    size < 1 ||
    size > 100 ||
    typeof keyword !== "string" ||
    orderBy !== "recent"
  ) {
    return res
      .status(400)
      .json({ message: "검색 또는 페이지 설정을 확인해 주세요." });
  }

  const search = keyword.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const filter = search
    ? {
        $or: [
          { name: { $regex: search, $options: "i" } },
          { description: { $regex: search, $options: "i" } },
        ],
      }
    : {};

  try {
    const [products, totalCount] = await Promise.all([
      Product.find(filter)
        .select("name price createdAt")
        .sort({ createdAt: -1, _id: -1 })
        .skip(skip)
        .limit(size),
      Product.countDocuments(filter),
    ]);

    res.json({
      list: products.map((product) => ({
        id: product.id,
        name: product.name,
        price: product.price,
        createdAt: product.createdAt,
      })),
      totalCount,
    });
  } catch (error) {
    next(error);
  }
});

app.post("/products", async (req, res, next) => {
  const { name, description, price, tags } = req.body ?? {};

  try {
    const product = await Product.create({ name, description, price, tags });
    res.status(201).json({ id: product.id, name: product.name });
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: "상품 정보를 확인해 주세요." });
    }
    next(error);
  }
});

app.get("/products/:id", async (req, res, next) => {
  const { id } = req.params;

  if (!mongoose.isObjectIdOrHexString(id)) {
    return res.status(400).json({ message: "상품 번호가 올바르지 않습니다." });
  }

  try {
    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({ message: "상품을 찾을 수 없습니다." });
    }

    res.json({
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      tags: product.tags,
      createdAt: product.createdAt,
    });
  } catch (error) {
    next(error);
  }
});

app.patch("/products/:id", async (req, res, next) => {
  const { id } = req.params;

  if (!mongoose.isObjectIdOrHexString(id)) {
    return res.status(400).json({ message: "상품 번호가 올바르지 않습니다." });
  }

  const updates = {};
  for (const field of ["name", "description", "price", "tags"]) {
    if (Object.hasOwn(req.body ?? {}, field)) {
      updates[field] = req.body[field];
    }
  }

  if (Object.keys(updates).length === 0) {
    return res
      .status(400)
      .json({ message: "수정할 상품 정보를 입력해 주세요." });
  }

  try {
    const product = await Product.findByIdAndUpdate(
      id,
      { $set: updates },
      { returnDocument: "after", runValidators: true },
    );

    if (!product) {
      return res.status(404).json({ message: "상품을 찾을 수 없습니다." });
    }

    res.json({ id: product.id, name: product.name, price: product.price });
  } catch (error) {
    if (error.name === "ValidationError" || error.name === "CastError") {
      return res.status(400).json({ message: "상품 정보를 확인해 주세요." });
    }
    next(error);
  }
});

app.delete("/products/:id", async (req, res, next) => {
  const { id } = req.params;

  if (!mongoose.isObjectIdOrHexString(id)) {
    return res.status(400).json({ message: "상품 번호가 올바르지 않습니다." });
  }

  try {
    const product = await Product.findByIdAndDelete(id);

    if (!product) {
      return res.status(404).json({ message: "상품을 찾을 수 없습니다." });
    }

    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

app.use((req, res) => {
  res.status(404).json({ message: "요청한 주소를 찾을 수 없습니다." });
});

app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);

  if (error.type === "entity.parse.failed") {
    return res
      .status(400)
      .json({ message: "요청 데이터 형식이 올바르지 않습니다." });
  }

  if (error.status === 413) {
    return res.status(413).json({ message: "요청 데이터가 너무 큽니다." });
  }

  console.error(error);
  res.status(500).json({ message: "서버에서 오류가 발생했습니다." });
});

async function startServer() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("MongoDB 연결 성공");

  app.listen(port, () => {
    console.log(`http://localhost:${port}`);
  });
}

startServer().catch((error) => {
  console.error("서버 시작 실패:", error.message);
  process.exitCode = 1;
});

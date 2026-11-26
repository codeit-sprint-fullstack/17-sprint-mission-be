import { fileURLToPath } from "node:url";
import cors from "cors";
import express from "express";
import { InputError, productDetails, readProduct } from "./product.js";
import { prisma } from "./src/db.js";
import { ProductRepository } from "./src/repository/ProductRepository.js";
import { ArticleRouter } from "./src/routers/ArticleRouter.js";
import { errorHandler } from "./src/routers/utils/asyncErrorHandler.js";

export const app = express();

const allowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  ...(process.env.CLIENT_ORIGIN ?? "").split(",").map((origin) => origin.trim()).filter(Boolean),
];
app.use(cors({ origin: allowedOrigins }));
app.use(express.json());

app.get("/health", async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ connected: true });
  } catch {
    res.status(503).json({ connected: false });
  }
});

function readInteger(value, defaultValue, minimum, label) {
  if (value === undefined) return defaultValue;
  const number = Number(value);
  if (typeof value !== "string" || !/^\d+$/.test(value) || !Number.isSafeInteger(number) || number < minimum || number > 2147483647) {
    throw new InputError(`${label}은 ${minimum} 이상의 정수여야 합니다.`);
  }
  return number;
}

app.get("/products", async (req, res) => {
  const offset = readInteger(req.query.offset, 0, 0, "offset");
  const limit = readInteger(req.query.limit, 10, 1, "limit");
  const { keyword = "", orderBy = "recent" } = req.query;
  if (typeof keyword !== "string") throw new InputError("검색어는 글자로 입력해 주세요.");
  if (orderBy !== "recent") throw new InputError("정렬 방식은 recent를 사용해 주세요.");

  const { data, count } = await ProductRepository.list({ skip: offset, take: limit, word: keyword, orderBy });
  const list = data.map(({ id, name, price, createdAt }) => ({ id: String(id), name, price, createdAt }));
  res.json({ list, totalCount: count });
});

app.post("/products", async (req, res) => {
  const product = await ProductRepository.create(readProduct(req.body, true));
  res.status(201).json(productDetails(product));
});

app.param("id", (req, res, next, id) => {
  req.productId = readInteger(id, undefined, 1, "상품 ID");
  next();
});

app.get("/products/:id", async (req, res) => {
  const product = await ProductRepository.findById(req.productId);
  if (!product) return res.status(404).json({ message: "상품을 찾을 수 없습니다." });
  res.json(productDetails(product));
});

app.patch("/products/:id", async (req, res) => {
  const product = await ProductRepository.update(req.productId, readProduct(req.body));
  res.json(productDetails(product));
});

app.delete("/products/:id", async (req, res) => {
  await ProductRepository.remove(req.productId);
  res.status(204).end();
});

app.use("/articles", ArticleRouter);

const clientDir = fileURLToPath(new URL("../client/dist/", import.meta.url));
app.use(express.static(clientDir));
app.get(["/", "/items", "/registration", "/items/:productId"], (req, res) => {
  res.sendFile("index.html", { root: clientDir });
});
app.use((req, res) => res.status(404).json({ message: "요청한 주소를 찾을 수 없습니다." }));

app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  if (error instanceof InputError) return res.status(400).json({ message: error.message });
  if (error.type === "entity.parse.failed") return res.status(400).json({ message: "JSON 형식이 올바르지 않습니다." });
  if (error.status === 413) return res.status(413).json({ message: "요청 데이터가 너무 큽니다." });
  if (error.status === 404) return res.status(404).json({ message: "요청한 파일을 찾을 수 없습니다." });
  if (error.code === "P2025" && req.productId !== undefined) {
    return res.status(404).json({ message: "상품을 찾을 수 없습니다." });
  }
  next(error);
});
app.use(errorHandler);

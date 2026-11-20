const mongoose = require("mongoose");
const Product = require("../models/Product");
const { createHttpError } = require("../middlewares/errorHandler");

const validateObjectId = (id) => {
  if (!mongoose.isValidObjectId(id)) {
    throw createHttpError(400, "유효하지 않은 상품 ID 형식입니다.");
  }
};

// 1. 상품 목록 조회 : GET /products?page=1&limit=10&orderBy=recent&keyword=키워드
const getProducts = async (req, res) => {
  const { orderBy = "recent", keyword = "" } = req.query;
  const limit = Math.max(1, Number.parseInt(req.query.limit, 10) || 10);
  const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);

  const skip =
    req.query.offset !== undefined
      ? Math.max(0, Number.parseInt(req.query.offset, 10) || 0)
      : (page - 1) * limit;

  const filters = {};
  if (keyword.trim()) {
    const regex = { $regex: keyword.trim(), $options: "i" };
    filters.$or = [{ name: regex }, { description: regex }];
  }

  const sort = orderBy === "oldest" ? { createdAt: 1 } : { createdAt: -1 };

  const [totalCount, products] = await Promise.all([
    Product.countDocuments(filters),
    Product.find(filters)
      .select("name price createdAt")
      .sort(sort)
      .skip(skip)
      .limit(limit),
  ]);

  res.status(200).json({
    pagination: {
      limit,
      currentPage: page,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
    },
    list: products,
  });
};

// 2. 상품 상세 조회 : GET /products/:id
const getProduct = async (req, res) => {
  validateObjectId(req.params.id);

  const product = await Product.findById(req.params.id).select(
    "name description price tags createdAt",
  );

  if (!product) {
    throw createHttpError(404, "상품을 찾을 수 없습니다.");
  }

  res.status(200).json(product);
};

// 3. 상품 등록 : POST /products
const createProduct = async (req, res) => {
  const { name, description, price, tags } = req.body;

  if (!name || !String(name).trim()) {
    throw createHttpError(400, "상품명을 입력해주세요.");
  }
  if (!description || !String(description).trim()) {
    throw createHttpError(400, "상품 소개를 입력해주세요.");
  }
  if (
    price === undefined ||
    price === null ||
    Number.isNaN(Number(price)) ||
    Number(price) < 0
  ) {
    throw createHttpError(
      400,
      "유효한 판매가격(0 이상의 숫자)을 입력해주세요.",
    );
  }
  if (tags !== undefined && !Array.isArray(tags)) {
    throw createHttpError(400, "태그는 문자열 배열 형식이어야 합니다.");
  }

  const product = await Product.create({
    name: String(name).trim(),
    description: String(description).trim(),
    price: Number(price),
    tags: tags ? tags.map((tag) => String(tag).trim()).filter(Boolean) : [],
  });

  res.status(201).json(product);
};

// 4. 상품 수정 : PATCH /products/:id
const updateProduct = async (req, res) => {
  validateObjectId(req.params.id);

  const { name, description, price, tags } = req.body;
  const product = await Product.findById(req.params.id);

  if (!product) {
    throw createHttpError(404, "상품을 찾을 수 없습니다.");
  }

  if (name !== undefined) {
    if (!String(name).trim()) {
      throw createHttpError(400, "상품명은 비워둘 수 없습니다.");
    }
    product.name = String(name).trim();
  }

  if (description !== undefined) {
    if (!String(description).trim()) {
      throw createHttpError(400, "상품 소개는 비워둘 수 없습니다.");
    }
    product.description = String(description).trim();
  }

  if (price !== undefined) {
    if (Number.isNaN(Number(price)) || Number(price) < 0) {
      throw createHttpError(400, "판매가격은 0 이상의 숫자여야 합니다.");
    }
    product.price = Number(price);
  }

  if (tags !== undefined) {
    if (!Array.isArray(tags)) {
      throw createHttpError(400, "태그는 문자열 배열 형식이어야 합니다.");
    }
    product.tags = tags.map((tag) => String(tag).trim()).filter(Boolean);
  }

  await product.save();
  res.status(200).json(product);
};

// 5. 상품 삭제 : DELETE /products/:id
const deleteProduct = async (req, res) => {
  validateObjectId(req.params.id);

  const result = await Product.deleteOne({ _id: req.params.id });
  if (result.deletedCount !== 1) {
    throw createHttpError(404, "상품을 찾을 수 없습니다.");
  }

  res.status(204).end();
};

module.exports = {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
};

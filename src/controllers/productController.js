// 상품 CRUD + 최신순/오래된순 정렬, offset / page 기반 페이지네이션을 Prisma 쿼리로 구현
import prisma from "../config/prisma.js";
import { createHttpError } from "../middlewares/errorHandler.js";

function parseProductId(rawId) {
  const id = Number(rawId);
  if (!Number.isInteger(id) || id <= 0) {
    throw createHttpError(400, "유효하지 않은 상품 ID 형식입니다.");
  }
  return id;
}

// 1. 상품 목록 조회: GET /products?page=1&limit=10&orderBy=recent&keyword=키워드
export async function getProducts(req, res, next) {
  try {
    const { orderBy = "recent", keyword = "" } = req.query;
    const limit = Math.max(1, Number.parseInt(req.query.limit, 10) || 10);
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);

    const skip =
      req.query.offset !== undefined
        ? Math.max(0, Number.parseInt(req.query.offset, 10) || 0)
        : (page - 1) * limit;

    const trimmedKeyword = String(keyword).trim();
    const where = trimmedKeyword
      ? {
          OR: [
            { name: { contains: trimmedKeyword, mode: "insensitive" } },
            { description: { contains: trimmedKeyword, mode: "insensitive" } },
          ],
        }
      : {};

    const orderByClause =
      orderBy === "oldest" ? { createdAt: "asc" } : { createdAt: "desc" };

    const [totalCount, products] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        select: {
          id: true,
          name: true,
          price: true,
          createdAt: true,
        },
        orderBy: orderByClause,
        skip,
        take: limit,
      }),
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
  } catch (err) {
    next(err);
  }
}

// 2. 상품 상세 조회: GET /products/:id
export async function getProduct(req, res, next) {
  try {
    const id = parseProductId(req.params.id);

    const product = await prisma.product.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        tags: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!product) {
      throw createHttpError(404, "상품을 찾을 수 없습니다.");
    }

    res.status(200).json(product);
  } catch (err) {
    next(err);
  }
}

// 3. 상품 등록: POST /products
export async function createProduct(req, res, next) {
  try {
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

    const product = await prisma.product.create({
      data: {
        name: String(name).trim(),
        description: String(description).trim(),
        price: Math.trunc(Number(price)),
        tags: tags ? tags.map((tag) => String(tag).trim()).filter(Boolean) : [],
      },
    });

    res.status(201).json(product);
  } catch (err) {
    next(err);
  }
}

// 4. 상품 수정: PATCH /products/:id
export async function updateProduct(req, res, next) {
  try {
    const id = parseProductId(req.params.id);
    const { name, description, price, tags } = req.body;

    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      throw createHttpError(404, "상품을 찾을 수 없습니다.");
    }

    const data = {};

    // 빈 문자열 ""은 거짓(Falsy), !를 붙이면 참
    if (name !== undefined) {
      if (!String(name).trim()) {
        throw createHttpError(400, "상품명은 비워둘 수 없습니다.");
      }
      data.name = String(name).trim();
    }

    if (description !== undefined) {
      if (!String(description).trim()) {
        throw createHttpError(400, "상품 소개는 비워둘 수 없습니다.");
      }
      data.description = String(description).trim();
    }

    if (price !== undefined) {
      if (Number.isNaN(Number(price)) || Number(price) < 0) {
        throw createHttpError(400, "판매가격은 0 이상의 숫자여야 합니다.");
      }
      data.price = Math.trunc(Number(price));
    }

    if (tags !== undefined) {
      if (!Array.isArray(tags)) {
        throw createHttpError(400, "태그는 문자열 배열 형식이어야 합니다.");
      }
      data.tags = tags.map((tag) => String(tag).trim()).filter(Boolean);
    }

    const updated = await prisma.product.update({
      where: { id },
      data,
    });

    res.status(200).json(updated);
  } catch (err) {
    next(err);
  }
}

// 5. 상품 삭제: DELETE /products/:id
export async function deleteProduct(req, res, next) {
  try {
    const id = parseProductId(req.params.id);

    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      throw createHttpError(404, "상품을 찾을 수 없습니다.");
    }

    await prisma.product.delete({ where: { id } });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

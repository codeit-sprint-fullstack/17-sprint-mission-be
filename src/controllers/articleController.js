// 자유게시판 CRUD + 검색/정렬/offset 페이지네이션
import prisma from "../config/prisma.js";
import { createHttpError } from "../middlewares/errorHandler.js";

function parseArticleId(rawId) {
  const id = Number(rawId);
  if (!Number.isInteger(id) || id <= 0) {
    throw createHttpError(400, "유효하지 않은 게시글 ID 형식입니다.");
  }
  return id;
}

// 1. 게시글 목록 조회: GET /articles?page=1&limit=10&orderBy=recent&keyword=검색어
export async function getArticles(req, res, next) {
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
            { title: { contains: trimmedKeyword, mode: "insensitive" } },
            { content: { contains: trimmedKeyword, mode: "insensitive" } },
          ],
        }
      : {};

    const orderByClause =
      orderBy === "oldest" ? { createdAt: "asc" } : { createdAt: "desc" };

    const [totalCount, list] = await Promise.all([
      prisma.article.count({ where }),
      prisma.article.findMany({
        where,
        select: {
          id: true,
          title: true,
          content: true,
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
        offset: skip,
        currentPage: page,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
      list,
    });
  } catch (err) {
    next(err);
  }
}

// 2. 게시글 상세 조회: GET /articles/:id
export async function getArticle(req, res, next) {
  try {
    const id = parseArticleId(req.params.id);

    const article = await prisma.article.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        content: true,
        createdAt: true,
      },
    });

    if (!article) {
      throw createHttpError(404, "게시글을 찾을 수 없습니다.");
    }

    res.status(200).json(article);
  } catch (err) {
    next(err);
  }
}

// 3. 게시글 등록: POST /articles
export async function createArticle(req, res, next) {
  try {
    const { title, content } = req.body;

    if (!title || !String(title).trim()) {
      throw createHttpError(400, "제목을 입력해주세요.");
    }
    if (!content || !String(content).trim()) {
      throw createHttpError(400, "내용을 입력해주세요.");
    }

    const created = await prisma.article.create({
      data: {
        title: String(title).trim(),
        content: String(content).trim(),
      },
      select: {
        id: true,
        title: true,
        content: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
}

// 4. 게시글 수정: PATCH /articles/:id
export async function updateArticle(req, res, next) {
  try {
    const id = parseArticleId(req.params.id);
    const { title, content } = req.body;

    const existing = await prisma.article.findUnique({ where: { id } });
    if (!existing) {
      throw createHttpError(404, "게시글을 찾을 수 없습니다.");
    }

    const data = {};

    if (title !== undefined) {
      if (!String(title).trim()) {
        throw createHttpError(400, "제목은 비워둘 수 없습니다.");
      }
      data.title = String(title).trim();
    }

    if (content !== undefined) {
      if (!String(content).trim()) {
        throw createHttpError(400, "내용은 비워둘 수 없습니다.");
      }
      data.content = String(content).trim();
    }

    const updated = await prisma.article.update({
      where: { id },
      data,
      select: {
        id: true,
        title: true,
        content: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.status(200).json(updated);
  } catch (err) {
    next(err);
  }
}

// 5. 게시글 삭제: DELETE /articles/:id
export async function deleteArticle(req, res, next) {
  try {
    const id = parseArticleId(req.params.id);

    const existing = await prisma.article.findUnique({ where: { id } });
    if (!existing) {
      throw createHttpError(404, "게시글을 찾을 수 없습니다.");
    }

    await prisma.article.delete({ where: { id } });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

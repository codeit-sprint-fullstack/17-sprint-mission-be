// 중고마켓/자유게시판 댓글 + cursor 페이지네이션
import prisma from "../config/prisma.js";
import { createHttpError } from "../middlewares/errorHandler.js";

function parsePositiveIntId(rawId, label) {
  const id = Number(rawId);
  if (!Number.isInteger(id) || id <= 0) {
    throw createHttpError(400, `유효하지 않은 ${label} ID 형식입니다.`);
  }
  return id;
}

async function fetchCommentsByParent({ whereParent, query }) {
  const limit = Math.max(1, Number.parseInt(query.limit, 10) || 10);
  const rawCursor = query.cursor;

  let cursorId = null;
  if (
    rawCursor !== undefined &&
    rawCursor !== null &&
    String(rawCursor).trim() !== ""
  ) {
    cursorId = parsePositiveIntId(rawCursor, "커서");
  }

  // 다음 페이지 존재 여부를 확인하기 위해 limit + 1개 조회
  const rows = await prisma.comment.findMany({
    where: whereParent,
    select: {
      id: true,
      content: true,
      createdAt: true,
    },
    orderBy: { id: "desc" },
    take: limit + 1,
    ...(cursorId ? { cursor: { id: cursorId }, skip: 1 } : {}),
  });

  const hasNext = rows.length > limit;
  const list = hasNext ? rows.slice(0, limit) : rows;
  const nextCursor = hasNext ? list[list.length - 1].id : null;

  return {
    list,
    nextCursor,
    hasNext,
  };
}

// 1. 중고마켓 댓글 등록: POST /products/:productId/comments
export async function createProductComment(req, res, next) {
  try {
    const productId = parsePositiveIntId(req.params.productId, "상품");
    const { content } = req.body;

    if (!content || !String(content).trim()) {
      throw createHttpError(400, "댓글 내용을 입력해주세요.");
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
    });
    if (!product) {
      throw createHttpError(404, "해당 상품을 찾을 수 없습니다.");
    }

    const comment = await prisma.comment.create({
      data: {
        content: String(content).trim(),
        productId,
      },
      select: {
        id: true,
        content: true,
        createdAt: true,
        updatedAt: true,
        productId: true,
      },
    });

    res.status(201).json(comment);
  } catch (err) {
    next(err);
  }
}

// 2. 중고마켓 댓글 목록 조회 (cursor 방식): GET /products/:productId/comments
export async function getProductComments(req, res, next) {
  try {
    const productId = parsePositiveIntId(req.params.productId, "상품");

    const product = await prisma.product.findUnique({
      where: { id: productId },
    });
    if (!product) {
      throw createHttpError(404, "해당 상품을 찾을 수 없습니다.");
    }

    const result = await fetchCommentsByParent({
      whereParent: { productId },
      query: req.query,
    });

    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

// 3. 자유게시판 댓글 등록: POST /articles/:articleId/comments
export async function createArticleComment(req, res, next) {
  try {
    const articleId = parsePositiveIntId(req.params.articleId, "게시글");
    const { content } = req.body;

    if (!content || !String(content).trim()) {
      throw createHttpError(400, "댓글 내용을 입력해주세요.");
    }

    const article = await prisma.article.findUnique({
      where: { id: articleId },
    });
    if (!article) {
      throw createHttpError(404, "해당 게시글을 찾을 수 없습니다.");
    }

    const comment = await prisma.comment.create({
      data: {
        content: String(content).trim(),
        articleId,
      },
      select: {
        id: true,
        content: true,
        createdAt: true,
        updatedAt: true,
        articleId: true,
      },
    });

    res.status(201).json(comment);
  } catch (err) {
    next(err);
  }
}

// 4. 자유게시판 댓글 목록 조회 (cursor 방식): GET /articles/:articleId/comments
export async function getArticleComments(req, res, next) {
  try {
    const articleId = parsePositiveIntId(req.params.articleId, "게시글");

    const article = await prisma.article.findUnique({
      where: { id: articleId },
    });
    if (!article) {
      throw createHttpError(404, "해당 게시글을 찾을 수 없습니다.");
    }

    const result = await fetchCommentsByParent({
      whereParent: { articleId },
      query: req.query,
    });

    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

// 5. 댓글 수정: PATCH /comments/:commentId
export async function updateComment(req, res, next) {
  try {
    const commentId = parsePositiveIntId(req.params.commentId, "댓글");
    const { content } = req.body;

    if (content === undefined || !String(content).trim()) {
      throw createHttpError(400, "수정할 댓글 내용을 입력해주세요.");
    }

    const existing = await prisma.comment.findUnique({
      where: { id: commentId },
    });
    if (!existing) {
      throw createHttpError(404, "댓글을 찾을 수 없습니다.");
    }

    const updated = await prisma.comment.update({
      where: { id: commentId },
      data: { content: String(content).trim() },
      select: {
        id: true,
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

// 6. 댓글 삭제: DELETE /comments/:commentId
export async function deleteComment(req, res, next) {
  try {
    const commentId = parsePositiveIntId(req.params.commentId, "댓글");

    const existing = await prisma.comment.findUnique({
      where: { id: commentId },
    });
    if (!existing) {
      throw createHttpError(404, "댓글을 찾을 수 없습니다.");
    }

    await prisma.comment.delete({ where: { id: commentId } });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

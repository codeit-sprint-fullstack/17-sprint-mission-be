import { Router } from "express";
import { Op } from "sequelize";
import { Article, Comment, Product } from "../models/index.js";

export function createCommentsRouter(parentType) {
  const router = Router({ mergeParams: true });
  const ParentModel = parentType === "product" ? Product : Article;
  const foreignKey = parentType === "product" ? "productId" : "articleId";
  const parentName = parentType === "product" ? "상품" : "게시글";

  router.get("/", async (request, response, next) => {
    try {
      const parentId = parseId(request.params.parentId);
      if (!parentId) return response.status(400).json({ message: `${parentName} ID 형식이 올바르지 않습니다.` });
      const parent = await ParentModel.findByPk(parentId, { attributes: ["id"] });
      if (!parent) return response.status(404).json({ message: `${parentName}을(를) 찾을 수 없습니다.` });
      const limit = Math.min(parseInteger(request.query.limit, 10), 100);
      if (!Number.isInteger(limit) || limit < 1) return response.status(400).json({ message: "limit은 1 이상의 정수여야 합니다." });

      const where = { [foreignKey]: parentId };
      if (request.query.cursor) {
        const cursor = decodeCursor(String(request.query.cursor));
        if (!cursor) return response.status(400).json({ message: "cursor 형식이 올바르지 않습니다." });
        where[Op.and] = [{
          [Op.or]: [
            { createdAt: { [Op.lt]: cursor.createdAt } },
            { [Op.and]: [{ createdAt: cursor.createdAt }, { id: { [Op.lt]: cursor.id } }] },
          ],
        }];
      }

      const rows = await Comment.findAll({
        where,
        attributes: ["id", "content", "createdAt"],
        order: [["createdAt", "DESC"], ["id", "DESC"]],
        limit: limit + 1,
      });
      const hasMore = rows.length > limit;
      const list = rows.slice(0, limit);
      const last = list.at(-1);
      response.json({
        list,
        nextCursor: hasMore && last ? encodeCursor(last) : null,
        hasMore,
      });
    } catch (error) {
      next(error);
    }
  });

  router.post("/", async (request, response, next) => {
    try {
      const parentId = parseId(request.params.parentId);
      if (!parentId) return response.status(400).json({ message: `${parentName} ID 형식이 올바르지 않습니다.` });
      const parent = await ParentModel.findByPk(parentId, { attributes: ["id"] });
      if (!parent) return response.status(404).json({ message: `${parentName}을(를) 찾을 수 없습니다.` });
      const content = request.body?.content;
      const comment = await Comment.create({ content, [foreignKey]: parentId });
      response.status(201).json(comment);
    } catch (error) {
      next(error);
    }
  });

  return router;
}

export const commentsRouter = Router();

commentsRouter.patch("/:id", async (request, response, next) => {
  try {
    const id = parseId(request.params.id);
    if (!id) return response.status(400).json({ message: "댓글 ID 형식이 올바르지 않습니다." });
    const comment = await Comment.findByPk(id);
    if (!comment) return response.status(404).json({ message: "댓글을 찾을 수 없습니다." });
    await comment.update({ content: request.body?.content });
    response.json(comment);
  } catch (error) {
    next(error);
  }
});

commentsRouter.delete("/:id", async (request, response, next) => {
  try {
    const id = parseId(request.params.id);
    if (!id) return response.status(400).json({ message: "댓글 ID 형식이 올바르지 않습니다." });
    const comment = await Comment.findByPk(id);
    if (!comment) return response.status(404).json({ message: "댓글을 찾을 수 없습니다." });
    await comment.destroy();
    response.status(204).end();
  } catch (error) {
    next(error);
  }
});

function parseInteger(value, fallback) {
  if (value === undefined) return fallback;
  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : Number.NaN;
}

function parseId(value) {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

function encodeCursor(comment) {
  return Buffer.from(`${new Date(comment.createdAt).toISOString()}|${comment.id}`).toString("base64url");
}

function decodeCursor(value) {
  try {
    const [dateValue, idValue, ...rest] = Buffer.from(value, "base64url").toString("utf8").split("|");
    const createdAt = new Date(dateValue);
    const id = Number(idValue);
    if (rest.length || Number.isNaN(createdAt.getTime()) || !Number.isSafeInteger(id) || id <= 0) return null;
    return { createdAt, id };
  } catch {
    return null;
  }
}

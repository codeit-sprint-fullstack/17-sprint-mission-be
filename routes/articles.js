import { Router } from "express";
import { Op } from "sequelize";
import { Article } from "../models/index.js";

export const articlesRouter = Router();

articlesRouter.get("/", async (request, response, next) => {
  try {
    const offset = parseInteger(request.query.offset, 0);
    const limit = Math.min(parseInteger(request.query.limit, 10), 100);
    const orderBy = request.query.orderBy ?? "recent";
    const keyword = String(request.query.keyword ?? "").trim();
    if (!Number.isInteger(offset) || !Number.isInteger(limit) || offset < 0 || limit < 1) {
      return response.status(400).json({ message: "offset과 limit은 유효한 정수여야 합니다." });
    }
    if (orderBy !== "recent") return response.status(400).json({ message: "지원하지 않는 정렬 기준입니다." });

    const where = keyword ? {
      [Op.or]: [
        { title: { [Op.iLike]: `%${escapeLike(keyword)}%` } },
        { content: { [Op.iLike]: `%${escapeLike(keyword)}%` } },
      ],
    } : {};
    const result = await Article.findAndCountAll({
      where,
      attributes: ["id", "title", "content", "createdAt"],
      order: [["createdAt", "DESC"], ["id", "DESC"]],
      offset,
      limit,
    });
    response.json({ list: result.rows, totalCount: result.count, offset, limit });
  } catch (error) {
    next(error);
  }
});

articlesRouter.post("/", async (request, response, next) => {
  try {
    const { title, content } = request.body ?? {};
    const article = await Article.create({ title, content });
    response.status(201).json(article);
  } catch (error) {
    next(error);
  }
});

articlesRouter.get("/:id", async (request, response, next) => {
  try {
    const id = parseId(request.params.id);
    if (!id) return response.status(400).json({ message: "게시글 ID 형식이 올바르지 않습니다." });
    const article = await Article.findByPk(id, { attributes: ["id", "title", "content", "createdAt"] });
    if (!article) return response.status(404).json({ message: "게시글을 찾을 수 없습니다." });
    response.json(article);
  } catch (error) {
    next(error);
  }
});

articlesRouter.patch("/:id", async (request, response, next) => {
  try {
    const id = parseId(request.params.id);
    if (!id) return response.status(400).json({ message: "게시글 ID 형식이 올바르지 않습니다." });
    const updates = Object.fromEntries(Object.entries(request.body ?? {}).filter(([key]) => ["title", "content"].includes(key)));
    if (Object.keys(updates).length === 0) return response.status(400).json({ message: "수정할 게시글 정보를 입력해 주세요." });
    const article = await Article.findByPk(id);
    if (!article) return response.status(404).json({ message: "게시글을 찾을 수 없습니다." });
    await article.update(updates);
    response.json(article);
  } catch (error) {
    next(error);
  }
});

articlesRouter.delete("/:id", async (request, response, next) => {
  try {
    const id = parseId(request.params.id);
    if (!id) return response.status(400).json({ message: "게시글 ID 형식이 올바르지 않습니다." });
    const article = await Article.findByPk(id);
    if (!article) return response.status(404).json({ message: "게시글을 찾을 수 없습니다." });
    await article.destroy();
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

function escapeLike(value) {
  return value.replace(/[\\%_]/g, "\\$&");
}

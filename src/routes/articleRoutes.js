import { Router } from "express";
import {
  getArticles,
  getArticle,
  createArticle,
  updateArticle,
  deleteArticle,
} from "../controllers/articleController.js";
import {
  createArticleComment,
  getArticleComments,
} from "../controllers/commentController.js";

const router = Router();

router.get("/", getArticles);
router.get("/:id", getArticle);
router.post("/", createArticle);
router.patch("/:id", updateArticle);
router.delete("/:id", deleteArticle);

// 자유게시판 댓글 등록 / 목록 조회
router.post("/:articleId/comments", createArticleComment);
router.get("/:articleId/comments", getArticleComments);

export default router;

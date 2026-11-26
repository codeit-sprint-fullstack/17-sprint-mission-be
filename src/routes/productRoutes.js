import { Router } from "express";
import {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../controllers/productController.js";
import {
  createProductComment,
  getProductComments,
} from "../controllers/commentController.js";

const router = Router();

router.get("/", getProducts);
router.get("/:id", getProduct);
router.post("/", createProduct);
router.patch("/:id", updateProduct);
router.delete("/:id", deleteProduct);

// 중고마켓 댓글 등록 / 목록 조회
router.post("/:productId/comments", createProductComment);
router.get("/:productId/comments", getProductComments);

export default router;

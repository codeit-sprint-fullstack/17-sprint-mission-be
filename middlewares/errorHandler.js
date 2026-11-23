import mongoose from "mongoose";
import { StructError } from "superstruct";
import BadRequestError from "../exceptions/BadRequestError.js";
import NotFoundError from "../exceptions/NotFoundError.js";

// 에러 종류 → 상태 코드 + JSON 응답 (인자 4개여야 에러 처리용으로 인식)
function errorHandler(error, req, res, next) {
  // 400: 잘못된 값 · 형식 검사 실패 · 잘못된 id · 깨진 JSON
  if (
    error instanceof BadRequestError ||
    error instanceof StructError ||
    error instanceof mongoose.Error.CastError ||
    error.type === "entity.parse.failed"
  ) {
    return res.status(400).json({ message: error.message });
  }

  // 404: 없는 상품 · 없는 주소
  if (error instanceof NotFoundError) {
    return res.status(404).json({ message: error.message });
  }

  // 500: 그 밖의 서버 오류 (원인은 서버 로그로 확인)
  console.error(error);
  return res.status(500).json({ message: "서버 오류가 발생했습니다." });
}

export default errorHandler;

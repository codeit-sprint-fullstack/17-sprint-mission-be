// 컨트롤러에서 상태 코드와 메시지를 담아 에러를 던질 때 사용하는 헬퍼
const mongoose = require("mongoose");

const createHttpError = (status, message) => {
  const err = new Error(message);
  err.status = status;
  err.name =
    status === 400
      ? "Bad Request"
      : status === 404
        ? "Not Found"
        : "Internal Server Error";
  return err;
};

const errorHandler = (err, req, res, next) => {
  console.error(err);

  if (
    err instanceof mongoose.Error.CastError ||
    err instanceof mongoose.Error.ValidationError
  ) {
    return res.status(400).json({
      name: "Bad Request",
      message: err.message,
    });
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(400).json({
      name: "Bad Request",
      message: `이미 사용 중인 ${field}입니다.`,
    });
  }

  const status = err.status || 500;
  const name = err.name || "Internal Server Error";
  const message = err.message || "서버 내부 오류가 발생했습니다.";

  res.status(status).json({ name, message });
};

module.exports = {
  createHttpError,
  errorHandler,
};

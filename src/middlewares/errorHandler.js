export function createHttpError(status, message) {
  const err = new Error(message);
  err.status = status;
  err.name =
    status === 400
      ? "Bad Request"
      : status === 404
        ? "Not Found"
        : "Internal Server Error";
  return err;
}

export function errorHandler(err, req, res, next) {
  console.error(err);

  // Prisma 주요 에러 코드 처리
  if (err?.code === "P2002") {
    const target = Array.isArray(err.meta?.target)
      ? err.meta.target.join(", ")
      : "필드";
    return res.status(400).json({
      name: "Bad Request",
      message: `이미 존재하는 ${target} 값입니다.`,
    });
  }

  if (err?.code === "P2025") {
    return res.status(404).json({
      name: "Not Found",
      message: "대상 데이터를 찾을 수 없습니다.",
    });
  }

  if (err?.code === "P2003") {
    return res.status(400).json({
      name: "Bad Request",
      message: "연결된 참조 데이터가 유효하지 않습니다.",
    });
  }

  const status = err.status || 500;
  const name = err.name || "Internal Server Error";
  const message = err.message || "서버 내부 오류가 발생했습니다.";

  res.status(status).json({ name, message });
}

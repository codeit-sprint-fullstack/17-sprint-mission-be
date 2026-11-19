// 찾는 대상 없음 (404)
class NotFoundError extends Error {
  constructor(message) {
    super(message);
    this.name = "NotFoundError";
  }
}

export default NotFoundError;

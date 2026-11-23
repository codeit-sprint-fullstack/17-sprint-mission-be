// 잘못된 요청 (400)
class BadRequestError extends Error {
  constructor(message) {
    super(message);
    this.name = "BadRequestError";
  }
}

export default BadRequestError;

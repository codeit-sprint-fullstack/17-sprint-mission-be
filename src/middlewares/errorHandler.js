import mongoose from 'mongoose';
import HttpError from '../utils/HttpError.js';

const FIELD_LABELS = { name: '상품명', description: '상품 소개', price: '판매 가격', tags: '태그' };

export function notFoundHandler(req, res, next) {
  next(new HttpError(404, `${req.method} ${req.originalUrl} 경로를 찾을 수 없어요.`));
}

export function errorHandler(err, req, res, next) {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ message: err.message });
  }

  if (err instanceof mongoose.Error.ValidationError) {
    const details = Object.fromEntries(
      Object.entries(err.errors).map(([field, e]) => [
        field,
        e instanceof mongoose.Error.CastError ? `${FIELD_LABELS[field] ?? field} 형식이 올바르지 않아요.` : e.message,
      ])
    );
    return res.status(400).json({
      message: Object.values(details)[0],
      details,
    });
  }

  if (err instanceof mongoose.Error.CastError) {
    return res.status(400).json({ message: `${FIELD_LABELS[err.path] ?? err.path} 형식이 올바르지 않아요.` });
  }

  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ message: '요청 body가 올바른 JSON 형식이 아니에요.' });
  }

  console.error(err);
  return res.status(500).json({ message: '서버에 문제가 생겼어요. 잠시 후 다시 시도해 주세요.' });
}

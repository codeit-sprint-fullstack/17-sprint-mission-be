import express from 'express';
import mongoose from 'mongoose';
import Product from '../models/Product.js';
import HttpError from '../utils/HttpError.js';

const productRouter = express.Router();

const EDITABLE_FIELDS = ['name', 'description', 'price', 'tags'];

function pickEditableFields(body = {}) {
  const result = {};
  for (const field of EDITABLE_FIELDS) {
    if (body[field] !== undefined) result[field] = body[field];
  }
  return result;
}

function assertTags(tags) {
  if (tags !== undefined && !Array.isArray(tags)) {
    throw new HttpError(400, 'tags는 배열이어야 해요. 예: ["전자제품", "중고"]');
  }
}

function assertValidId(id) {
  if (!mongoose.isValidObjectId(id)) {
    throw new HttpError(400, '올바르지 않은 상품 ID예요.');
  }
}

function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function toPositiveInt(value, defaultValue) {
  const num = Number.parseInt(value, 10);
  return Number.isNaN(num) || num < 0 ? defaultValue : num;
}

productRouter.post('/', async (req, res) => {
  const data = pickEditableFields(req.body);
  assertTags(data.tags);

  const product = await Product.create(data);
  res.status(201).json(product);
});

productRouter.get('/', async (req, res) => {
  const { orderBy = 'recent', keyword = '' } = req.query;

  let limit = Math.min(toPositiveInt(req.query.limit ?? req.query.pageSize, 10) || 10, 100);
  let offset = toPositiveInt(req.query.offset, 0);
  if (req.query.page !== undefined) {
    const page = Math.max(toPositiveInt(req.query.page, 1), 1);
    offset = (page - 1) * limit;
  }

  const SORT_OPTIONS = {
    recent: { createdAt: -1, _id: -1 },
  };
  const sort = SORT_OPTIONS[orderBy];
  if (!sort) {
    throw new HttpError(400, `orderBy는 ${Object.keys(SORT_OPTIONS).join(', ')} 중 하나여야 해요.`);
  }

  const trimmed = String(keyword).trim();
  const filter = trimmed
    ? {
        $or: [
          { name: { $regex: escapeRegex(trimmed), $options: 'i' } },
          { description: { $regex: escapeRegex(trimmed), $options: 'i' } },
        ],
      }
    : {};

  const [list, totalCount] = await Promise.all([
    Product.find(filter)
      .sort(sort)
      .skip(offset)
      .limit(limit)
      .select('name price createdAt favoriteCount'),
    Product.countDocuments(filter),
  ]);

  res.status(200).json({ list, totalCount });
});

productRouter.get('/:id', async (req, res) => {
  const { id } = req.params;
  assertValidId(id);

  const product = await Product.findById(id).select('name description price tags createdAt favoriteCount');
  if (!product) throw new HttpError(404, '상품을 찾을 수 없어요.');

  res.status(200).json(product);
});

productRouter.patch('/:id', async (req, res) => {
  const { id } = req.params;
  assertValidId(id);

  const data = pickEditableFields(req.body);
  assertTags(data.tags);
  if (Object.keys(data).length === 0) {
    throw new HttpError(400, `수정할 값을 보내 주세요. (${EDITABLE_FIELDS.join(', ')})`);
  }

  const product = await Product.findByIdAndUpdate(id, data, {
    returnDocument: 'after',
    runValidators: true,
  });
  if (!product) throw new HttpError(404, '상품을 찾을 수 없어요.');

  res.status(200).json(product);
});

productRouter.delete('/:id', async (req, res) => {
  const { id } = req.params;
  assertValidId(id);

  const product = await Product.findByIdAndDelete(id);
  if (!product) throw new HttpError(404, '상품을 찾을 수 없어요.');

  res.sendStatus(204);
});

export default productRouter;

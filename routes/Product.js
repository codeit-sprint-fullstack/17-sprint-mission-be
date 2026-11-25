const express = require('express');
const mongoose = require('mongoose');
const Product = require('../models/Product');

const router = express.Router();
const fields = ['name', 'description', 'price', 'tags'];

function validateBody(req, res, next) {
  const body = req.body;
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return res.status(400).json({ message: '상품 정보를 JSON 객체로 보내 주세요.' });
  }

  const keys = Object.keys(body);
  if (!keys.length || keys.some(key => !fields.includes(key))) {
    return res.status(400).json({ message: '상품 필드를 확인해 주세요.' });
  }

  const errors = {};
  const data = {};
  for (const key of req.method === 'PATCH' ? keys : fields) {
    const value = body[key];
    if (key === 'tags') {
      if (value === undefined) continue;
      if (!Array.isArray(value) || value.some(tag => typeof tag !== 'string' || !tag.trim() || Array.from(tag.trim()).length > 5)) {
        errors.tags = '태그는 1자 이상 5자 이내로 입력해 주세요.';
      } else {
        data.tags = value.map(tag => tag.trim());
      }
    } else if (key === 'price') {
      if (Number.isSafeInteger(value) && value >= 0) data.price = value;
      else errors.price = '가격은 0 이상의 정수로 보내 주세요.';
    } else {
      const text = typeof value === 'string' ? value.trim() : '';
      const length = Array.from(text).length;
      const [min, max] = key === 'name' ? [1, 10] : [10, 100];
      if (length < min || length > max) {
        const label = key === 'name' ? '상품명' : '상품 소개';
        errors[key] = label + '은 ' + min + '자 이상 ' + max + '자 이내로 입력해 주세요.';
      } else {
        data[key] = text;
      }
    }
  }

  if (Object.keys(errors).length) {
    return res.status(400).json({ message: '상품 입력값을 확인해 주세요.', errors });
  }
  req.productData = data;
  next();
}

function summary(product) {
  return { id: product._id.toString(), name: product.name, price: product.price, createdAt: product.createdAt };
}

function detail(product) {
  return { ...summary(product), description: product.description, tags: product.tags ?? [] };
}

function notFound(res) {
  return res.status(404).json({ message: '상품을 찾을 수 없습니다.' });
}

function integerParameter(value, fallback) {
  if (value === undefined) return fallback;
  return typeof value === 'string' && /^\d+$/.test(value) ? Number(value) : NaN;
}

router.param('id', (_req, res, next, id) => {
  if (!mongoose.isObjectIdOrHexString(id)) {
    return res.status(400).json({ message: '상품 ID 형식을 확인해 주세요.' });
  }
  next();
});

router.post('/', validateBody, async (req, res) => {
  const product = await Product.create(req.productData);
  res.location('/api/products/' + product.id)
    .status(201).json({ ...detail(product), updatedAt: product.updatedAt });
});

router.get('/', async (req, res) => {
  const { keyword = '', orderBy = 'recent' } = req.query;
  const offset = integerParameter(req.query.offset, 0);
  const limit = integerParameter(req.query.limit, 20);
  if (!Number.isSafeInteger(offset) || !Number.isSafeInteger(limit) || limit < 1 || limit > 100 ||
      orderBy !== 'recent' || typeof keyword !== 'string' || keyword.length > 100) {
    return res.status(400).json({ message: 'offset, limit, orderBy, keyword를 확인해 주세요.' });
  }

  const filter = {};
  if (keyword.trim()) {
    const escaped = keyword.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const match = { $regex: escaped, $options: 'i' };
    filter.$or = [{ name: match }, { description: match }];
  }

  const [products, totalCount] = await Promise.all([
    Product.find(filter).select('name price createdAt').sort({ createdAt: -1, _id: -1 })
      .skip(offset).limit(limit).lean(),
    Product.countDocuments(filter),
  ]);
  res.json({ list: products.map(summary), totalCount });
});

router.get('/:id', async (req, res) => {
  const product = await Product.findById(req.params.id).lean();
  if (!product) return notFound(res);
  res.json(detail(product));
});

router.patch('/:id', validateBody, async (req, res) => {
  const product = await Product.findByIdAndUpdate(req.params.id, { $set: req.productData }, {
    new: true, runValidators: true,
  });
  if (!product) return notFound(res);
  res.json({ ...detail(product), updatedAt: product.updatedAt });
});

router.delete('/:id', async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) return notFound(res);
  res.status(204).end();
});

module.exports = router;

import express from 'express';
import { Product } from '../models/Product.js';

const router = express.Router();

// 상품 등록
router.post('/', async (req, res) => {
    const { name, description, price, tags } = req.body;
    const product = await Product.create({ name, description, price, tags });
    res.status(201).json(product);
});

// 상품 상세 조회
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    const product = await Product.findById(id).select(
        'name description price tags createdAt',
    );

    if (!product)
        return res.status(404).json({ message: '상품을 찾을 수 없습니다.' });
    res.json(product);
});

// 상품 수정
router.patch('/:id', async (req, res) => {
    const { id } = req.params;
    const { name, description, price, tags } = req.body;

    const product = await Product.findById(id);
    if (!product)
        return res.status(404).json({ message: '상품을 찾을 수 없습니다.' });

    // 보낸 값만 수정
    if (name !== undefined) product.name = name;
    if (description !== undefined) product.description = description;
    if (price !== undefined) product.price = price;
    if (tags !== undefined) product.tags = tags;

    await product.save();
    res.json(product);
});

// 상품 삭제
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    const product = await Product.findByIdAndDelete(id);

    if (!product)
        return res.status(404).json({ message: '상품을 찾을 수 없습니다.' });
    res.sendStatus(204);
});

// 상품 목록 조회
router.get('/', async (req, res) => {
    const {
        page = 1,
        pageSize = 10,
        orderBy = 'recent',
        keyword = '',
    } = req.query;

    const pageValue = Number(page);
    const pageSizeValue = Number(pageSize);
    if (!Number.isInteger(pageValue) || pageValue < 1)
        return res
            .status(400)
            .json({ message: 'page는 1 이상의 정수여야 합니다.' });
    if (
        !Number.isInteger(pageSizeValue) ||
        pageSizeValue < 1 ||
        pageSizeValue > 100
    )
        return res
            .status(400)
            .json({ message: 'pageSize는 1~100 사이의 정수여야 합니다.' });

    const offset = (pageValue - 1) * pageSizeValue;

    const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const filter = keyword
        ? {
              $or: [
                  { name: { $regex: escapedKeyword, $options: 'i' } },
                  { description: { $regex: escapedKeyword, $options: 'i' } },
              ],
          }
        : {};
    const sort =
        orderBy === 'favorite'
            ? { favoriteCount: -1, createdAt: -1 }
            : { createdAt: -1 };

    const [list, totalCount] = await Promise.all([
        Product.find(filter)
            .sort(sort)
            .skip(offset)
            .limit(pageSizeValue)
            .select('name price favoriteCount createdAt'),
        Product.countDocuments(filter),
    ]);

    res.json({ list, totalCount });
});

export default router;

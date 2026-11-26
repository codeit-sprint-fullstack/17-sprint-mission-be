import express from 'express';
import prisma from '../lib/prisma.js';
import BadRequestError from '../errors/BadRequestError.js';
import NotFoundError from '../errors/NotFoundError.js';
import { escapeLike } from '../utils/escapeLike.js';
import { parsePagination } from '../utils/pagination.js';
import { MAX_INT, parseId } from '../utils/parseId.js';
import { parseText } from '../utils/parseText.js';

const router = express.Router();

function parsePrice(value) {
    if (value === undefined || value === null || String(value).trim() === '') {
        throw new BadRequestError('판매 가격을 입력해 주세요.');
    }
    const price = typeof value === 'string' ? Number(value) : value;
    if (typeof price !== 'number' || Number.isNaN(price)) {
        throw new BadRequestError('판매 가격은 숫자여야 합니다.');
    }
    if (!Number.isInteger(price)) {
        throw new BadRequestError('판매 가격은 정수여야 합니다.');
    }
    if (price < 0) {
        throw new BadRequestError('판매 가격은 0 이상이어야 합니다.');
    }
    if (price > MAX_INT) {
        throw new BadRequestError('판매 가격이 너무 큽니다.');
    }
    return price;
}

function parseTags(value = []) {
    if (!Array.isArray(value) || value.some((tag) => typeof tag !== 'string')) {
        throw new BadRequestError('태그는 문자열 목록이어야 합니다.');
    }
    return value;
}

const PARSERS = {
    name: (value) => parseText(value, '상품명을 입력해 주세요.'),
    description: (value) => parseText(value, '상품 소개를 입력해 주세요.'),
    price: parsePrice,
    tags: parseTags,
};

// partial이면 요청에 보낸 필드만 검사한다 (PATCH)
function parseProduct(body = {}, { partial = false } = {}) {
    const data = {};
    for (const [field, parse] of Object.entries(PARSERS)) {
        if (partial && body[field] === undefined) continue;
        data[field] = parse(body[field]);
    }
    return data;
}

router.post('/', async (req, res) => {
    const data = parseProduct(req.body);
    const product = await prisma.product.create({ data });
    res.status(201).json(product);
});

router.get('/', async (req, res) => {
    const { page, pageSize } = parsePagination(req.query);
    const keyword = escapeLike(String(req.query.keyword ?? '').trim());

    const where = keyword
        ? {
              OR: [
                  { name: { contains: keyword, mode: 'insensitive' } },
                  { description: { contains: keyword, mode: 'insensitive' } },
              ],
          }
        : {};

    const [list, totalCount] = await Promise.all([
        prisma.product.findMany({
            where,
            orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
            skip: (page - 1) * pageSize,
            take: pageSize,
            select: { id: true, name: true, price: true, createdAt: true },
        }),
        prisma.product.count({ where }),
    ]);

    res.json({ list, totalCount });
});

router.get('/:id', async (req, res) => {
    const product = await prisma.product.findUnique({
        where: { id: parseId(req.params.id) },
        select: {
            id: true,
            name: true,
            description: true,
            price: true,
            tags: true,
            createdAt: true,
        },
    });
    if (!product) throw new NotFoundError();
    res.json(product);
});

router.patch('/:id', async (req, res) => {
    const id = parseId(req.params.id);
    const data = parseProduct(req.body, { partial: true });
    const product = await prisma.product.update({ where: { id }, data });
    res.json(product);
});

router.delete('/:id', async (req, res) => {
    await prisma.product.delete({ where: { id: parseId(req.params.id) } });
    res.sendStatus(204);
});

export default router;

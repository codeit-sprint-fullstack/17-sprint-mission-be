import express from 'express';
import prisma from '../lib/prisma.js';
import NotFoundError from '../errors/NotFoundError.js';
import { escapeLike } from '../utils/escapeLike.js';
import { parsePagination } from '../utils/pagination.js';
import { parseId } from '../utils/parseId.js';
import { parseText } from '../utils/parseText.js';

const router = express.Router();

const articleSelect = { id: true, title: true, content: true, createdAt: true };

const MESSAGES = {
    title: '제목을 입력해 주세요.',
    content: '내용을 입력해 주세요.',
};

// partial이면 요청에 보낸 필드만 검사한다 (PATCH)
function parseArticle(body = {}, { partial = false } = {}) {
    const data = {};
    for (const [field, message] of Object.entries(MESSAGES)) {
        if (partial && body[field] === undefined) continue;
        data[field] = parseText(body[field], message);
    }
    return data;
}

router.post('/', async (req, res) => {
    const data = parseArticle(req.body);
    const article = await prisma.article.create({ data });
    res.status(201).json(article);
});

router.get('/', async (req, res) => {
    const { page, pageSize } = parsePagination(req.query);
    const keyword = escapeLike(String(req.query.keyword ?? '').trim());

    const where = keyword
        ? {
              OR: [
                  { title: { contains: keyword, mode: 'insensitive' } },
                  { content: { contains: keyword, mode: 'insensitive' } },
              ],
          }
        : {};

    const [list, totalCount] = await Promise.all([
        prisma.article.findMany({
            where,
            orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
            skip: (page - 1) * pageSize,
            take: pageSize,
            select: articleSelect,
        }),
        prisma.article.count({ where }),
    ]);

    res.json({ list, totalCount });
});

router.get('/:id', async (req, res) => {
    const article = await prisma.article.findUnique({
        where: { id: parseId(req.params.id) },
        select: articleSelect,
    });
    if (!article) throw new NotFoundError('게시글을 찾을 수 없습니다.');
    res.json(article);
});

router.patch('/:id', async (req, res) => {
    const id = parseId(req.params.id);
    const data = parseArticle(req.body, { partial: true });
    const article = await prisma.article.update({ where: { id }, data });
    res.json(article);
});

router.delete('/:id', async (req, res) => {
    await prisma.article.delete({ where: { id: parseId(req.params.id) } });
    res.sendStatus(204);
});

export default router;

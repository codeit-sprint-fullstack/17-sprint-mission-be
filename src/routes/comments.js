import express from 'express';
import prisma from '../lib/prisma.js';
import NotFoundError from '../errors/NotFoundError.js';
import { parseCursorPagination } from '../utils/pagination.js';
import { parseId } from '../utils/parseId.js';
import { parseText } from '../utils/parseText.js';

const router = express.Router();

function parseContent(value) {
    return parseText(value, '댓글 내용을 입력해 주세요.');
}

async function ensureProduct(id) {
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundError('상품을 찾을 수 없습니다.');
}

async function ensureArticle(id) {
    const article = await prisma.article.findUnique({ where: { id } });
    if (!article) throw new NotFoundError('게시글을 찾을 수 없습니다.');
}

// 최신순(id 내림차순)이라 다음 페이지는 cursor보다 작은 id.
// 하나 더 가져와서 다음 페이지가 있는지 확인한다.
async function findCommentPage(where, { cursor, limit }) {
    const rows = await prisma.comment.findMany({
        where: { ...where, ...(cursor && { id: { lt: cursor } }) },
        orderBy: { id: 'desc' },
        take: limit + 1,
        select: { id: true, content: true, createdAt: true },
    });
    const list = rows.slice(0, limit);
    const nextCursor = rows.length > limit ? list.at(-1).id : null;
    return { list, nextCursor };
}

// 중고마켓 댓글
router.post('/products/:productId/comments', async (req, res) => {
    const productId = parseId(req.params.productId);
    const content = parseContent(req.body?.content);
    await ensureProduct(productId);
    const comment = await prisma.comment.create({
        data: { content, productId },
    });
    res.status(201).json(comment);
});

router.get('/products/:productId/comments', async (req, res) => {
    const productId = parseId(req.params.productId);
    const pagination = parseCursorPagination(req.query);
    await ensureProduct(productId);
    res.json(await findCommentPage({ productId }, pagination));
});

// 자유게시판 댓글
router.post('/articles/:articleId/comments', async (req, res) => {
    const articleId = parseId(req.params.articleId);
    const content = parseContent(req.body?.content);
    await ensureArticle(articleId);
    const comment = await prisma.comment.create({
        data: { content, articleId },
    });
    res.status(201).json(comment);
});

router.get('/articles/:articleId/comments', async (req, res) => {
    const articleId = parseId(req.params.articleId);
    const pagination = parseCursorPagination(req.query);
    await ensureArticle(articleId);
    res.json(await findCommentPage({ articleId }, pagination));
});

router.patch('/comments/:id', async (req, res) => {
    const id = parseId(req.params.id);
    const { content } = req.body ?? {};
    const data =
        content === undefined ? {} : { content: parseContent(content) };
    const comment = await prisma.comment.update({ where: { id }, data });
    res.json(comment);
});

router.delete('/comments/:id', async (req, res) => {
    await prisma.comment.delete({ where: { id: parseId(req.params.id) } });
    res.sendStatus(204);
});

export default router;

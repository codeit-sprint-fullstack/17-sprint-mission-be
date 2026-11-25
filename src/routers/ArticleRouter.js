import express from 'express';
import { create, object } from 'superstruct';

import { asyncErrorHandler } from './utils/asyncErrorHandler.js';
import { ExceptionMessage } from '../constant/ExceptionMessage.js';
import { NotFoundException } from '../exceptions/NotFoundException.js';
import { prisma } from '../config/prisma.js';

import { IdStruct } from './structs/IdStruct.js';
import { CreateArticleRequestStruct } from './structs/article/CreateArticleRequestStruct.js';
import { UpdateArticleRequestStruct } from './structs/article/UpdateArticleRequestStruct.js';
import { GetArticleListRequestStruct } from './structs/article/GetArticleListRequestStruct.js';
import { createCommentHandler, getCommentListHandler } from './CommentRouter.js';

export const ArticleRouter = express.Router();

const ArticleIdParamStruct = object({ articleId: IdStruct });

// 응답에 포함할 필드
const articleSelect = {
    id: true,
    title: true,
    content: true,
    createdAt: true,
};

// 게시글 등록 api
ArticleRouter.post(
    '/',
    asyncErrorHandler(async (req, res) => {
        const data = create(req.body, CreateArticleRequestStruct);

        const article = await prisma.article.create({ data, select: articleSelect });

        return res.status(201).send(article);
    }),
);

// 게시글 조회 api
ArticleRouter.get(
    '/:articleId',
    asyncErrorHandler(async (req, res) => {
        const { articleId } = create(req.params, ArticleIdParamStruct);

        const article = await prisma.article.findUnique({
            where: { id: articleId },
            select: articleSelect,
        });

        if (!article) {
            throw new NotFoundException(ExceptionMessage.ARTICLE_NOT_FOUND);
        }

        return res.send(article);
    }),
);

// 게시글 수정 api
// 없는 게시글이면 prisma 가 P2025 에러를 던지고, asyncErrorHandler 에서 404 로 변환합니다.
ArticleRouter.patch(
    '/:articleId',
    asyncErrorHandler(async (req, res) => {
        const { articleId } = create(req.params, ArticleIdParamStruct);
        const data = create(req.body, UpdateArticleRequestStruct);

        const article = await prisma.article.update({
            where: { id: articleId },
            data,
            select: articleSelect,
        });

        return res.send(article);
    }),
);

// 게시글 삭제 api (달린 댓글은 onDelete: Cascade 로 함께 삭제됩니다)
ArticleRouter.delete(
    '/:articleId',
    asyncErrorHandler(async (req, res) => {
        const { articleId } = create(req.params, ArticleIdParamStruct);

        await prisma.article.delete({ where: { id: articleId } });

        return res.status(204).send();
    }),
);

// 게시글 목록 조회 api (offset 페이지네이션)
ArticleRouter.get(
    '/',
    asyncErrorHandler(async (req, res) => {
        const { skip, take, orderBy, word } = create(req.query, GetArticleListRequestStruct);

        const where = word
            ? {
                  OR: [
                      { title: { contains: word, mode: 'insensitive' } },
                      { content: { contains: word, mode: 'insensitive' } },
                  ],
              }
            : undefined;

        const [count, data] = await Promise.all([
            prisma.article.count({ where }),
            prisma.article.findMany({
                where,
                orderBy: orderBy === 'recent' ? { createdAt: 'desc' } : { id: 'asc' },
                skip,
                take,
                select: articleSelect,
            }),
        ]);

        return res.send({ count, data });
    }),
);

// 자유게시판 댓글 등록 / 목록 조회 api
ArticleRouter.post('/:articleId/comments', createCommentHandler('article'));
ArticleRouter.get('/:articleId/comments', getCommentListHandler('article'));

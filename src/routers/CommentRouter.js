import express from 'express';
import { create, object } from 'superstruct';

import { asyncErrorHandler } from './utils/asyncErrorHandler.js';
import { ExceptionMessage } from '../constant/ExceptionMessage.js';
import { NotFoundException } from '../exceptions/NotFoundException.js';
import { prisma } from '../config/prisma.js';

import { IdStruct } from './structs/IdStruct.js';
import { CreateCommentRequestStruct } from './structs/comment/CreateCommentRequestStruct.js';
import { UpdateCommentRequestStruct } from './structs/comment/UpdateCommentRequestStruct.js';
import { GetCommentListRequestStruct } from './structs/comment/GetCommentListRequestStruct.js';

export const CommentRouter = express.Router();

const CommentIdParamStruct = object({ commentId: IdStruct });

// 응답에 포함할 필드
const commentSelect = {
    id: true,
    content: true,
    createdAt: true,
};

// 댓글이 속한 대상(상품/게시글)별 설정
const parents = {
    product: {
        paramStruct: object({ productId: IdStruct }),
        paramName: 'productId',
        notFoundMessage: ExceptionMessage.PRODUCT_NOT_FOUND,
    },
    article: {
        paramStruct: object({ articleId: IdStruct }),
        paramName: 'articleId',
        notFoundMessage: ExceptionMessage.ARTICLE_NOT_FOUND,
    },
};

async function getParentId(parentType, params) {
    const { paramStruct, paramName, notFoundMessage } = parents[parentType];
    const parentId = create(params, paramStruct)[paramName];

    const parent = await prisma[parentType].findUnique({
        where: { id: parentId },
        select: { id: true },
    });
    if (!parent) {
        throw new NotFoundException(notFoundMessage);
    }

    return parentId;
}

// 댓글 등록 api (ProductRouter, ArticleRouter 에서 사용)
export function createCommentHandler(parentType) {
    const { paramName } = parents[parentType];

    return asyncErrorHandler(async (req, res) => {
        const parentId = await getParentId(parentType, req.params);
        const { content } = create(req.body, CreateCommentRequestStruct);

        const comment = await prisma.comment.create({
            data: { content, [paramName]: parentId },
            select: commentSelect,
        });

        return res.status(201).send(comment);
    });
}

// 댓글 목록 조회 api (cursor 페이지네이션, 최신순)
// 응답의 nextCursor 를 다음 요청의 cursor 로 넘기면 이어서 조회합니다. 더 없으면 null 입니다.
export function getCommentListHandler(parentType) {
    const { paramName } = parents[parentType];

    return asyncErrorHandler(async (req, res) => {
        const parentId = await getParentId(parentType, req.params);
        const { cursor, take } = create(req.query, GetCommentListRequestStruct);

        // 다음 페이지가 있는지 알기 위해 하나 더 가져옵니다.
        const comments = await prisma.comment.findMany({
            where: { [paramName]: parentId },
            orderBy: { id: 'desc' },
            cursor: cursor ? { id: cursor } : undefined,
            skip: cursor ? 1 : 0,
            take: take + 1,
            select: commentSelect,
        });

        const hasNext = comments.length > take;
        const data = comments.slice(0, take);

        return res.send({
            nextCursor: hasNext ? data[data.length - 1].id : null,
            data,
        });
    });
}

// 댓글 수정 api
// 없는 댓글이면 prisma 가 P2025 에러를 던지고, asyncErrorHandler 에서 404 로 변환합니다.
CommentRouter.patch(
    '/:commentId',
    asyncErrorHandler(async (req, res) => {
        const { commentId } = create(req.params, CommentIdParamStruct);
        const { content } = create(req.body, UpdateCommentRequestStruct);

        const comment = await prisma.comment.update({
            where: { id: commentId },
            data: { content },
            select: commentSelect,
        });

        return res.send(comment);
    }),
);

// 댓글 삭제 api
CommentRouter.delete(
    '/:commentId',
    asyncErrorHandler(async (req, res) => {
        const { commentId } = create(req.params, CommentIdParamStruct);

        await prisma.comment.delete({ where: { id: commentId } });

        return res.status(204).send();
    }),
);

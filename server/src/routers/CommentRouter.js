import express from 'express';
import { assert, object, optional, refine, string } from 'superstruct';

import { BadRequestException } from '../exceptions/BadRequestException.js';
import { CommentRepository } from '../repository/CommentRepository.js';
import { parseId, parsePage } from '../validation.js';
import { asyncErrorHandler } from './utils/asyncErrorHandler.js';

export const CommentRouter = express.Router();

const commentBody = object({ content: refine(string(), 'nonblank', value => value.trim().length > 0) });
const listQuery = object({
    take: optional(string()),
    limit: optional(string()),
    cursor: optional(string()),
});

function registerParentRoutes(path, parentModel, idParam) {
    CommentRouter.post(path, asyncErrorHandler(async (req, res) => {
        const parentId = parseId(req.params[idParam], idParam);
        assert(req.body, commentBody);
        const comment = await CommentRepository.create(parentModel, parentId, req.body.content);
        res.status(201).json(comment);
    }));

    CommentRouter.get(path, asyncErrorHandler(async (req, res) => {
        const parentId = parseId(req.params[idParam], idParam);
        assert(req.query, listQuery);
        const { limit, take, cursor } = req.query;
        if (limit !== undefined && take !== undefined) {
            throw new BadRequestException('Validation failed', 'Choose either limit or take.');
        }
        const size = parsePage(limit ?? take, 10, 1, 100, 'limit');
        const afterId = cursor === undefined ? undefined : parseId(cursor, 'cursor');
        res.json(await CommentRepository.list(parentModel, parentId, size, afterId));
    }));
}

registerParentRoutes('/products/:productId/comments', 'product', 'productId');
registerParentRoutes('/articles/:articleId/comments', 'article', 'articleId');

CommentRouter.patch('/comments/:commentId', asyncErrorHandler(async (req, res) => {
    const id = parseId(req.params.commentId, 'commentId');
    assert(req.body, commentBody);
    res.json(await CommentRepository.update(id, req.body.content));
}));

CommentRouter.delete('/comments/:commentId', asyncErrorHandler(async (req, res) => {
    const id = parseId(req.params.commentId, 'commentId');
    await CommentRepository.remove(id);
    res.status(204).end();
}));

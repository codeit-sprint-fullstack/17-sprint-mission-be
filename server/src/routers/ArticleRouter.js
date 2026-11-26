import express from 'express';
import { assert, enums, object, optional, partial, refine, string } from 'superstruct';

import { BadRequestException } from '../exceptions/BadRequestException.js';
import { ArticleRepository } from '../repository/ArticleRepository.js';
import { parseId, parsePage } from '../validation.js';
import { asyncErrorHandler } from './utils/asyncErrorHandler.js';

export const ArticleRouter = express.Router();

const text = refine(string(), 'nonblank', value => value.trim().length > 0);
const articleBody = object({ title: text, content: text });
const articlePatch = partial(articleBody);
const listQuery = object({
    skip: optional(string()),
    offset: optional(string()),
    take: optional(string()),
    limit: optional(string()),
    word: optional(text),
    keyword: optional(text),
    orderBy: optional(enums(['recent'])),
});

ArticleRouter.post('/', asyncErrorHandler(async (req, res) => {
    assert(req.body, articleBody);
    const article = await ArticleRepository.create(req.body);
    res.status(201).json(article);
}));

ArticleRouter.get('/', asyncErrorHandler(async (req, res) => {
    assert(req.query, listQuery);
    const { skip, offset, take, limit, word, keyword } = req.query;
    if ((skip !== undefined && offset !== undefined) || (take !== undefined && limit !== undefined)
        || (word !== undefined && keyword !== undefined)) {
        throw new BadRequestException('Validation failed', 'Provide only one name for each query parameter.');
    }
    const start = parsePage(skip ?? offset, 0, 0, 2147483647, 'skip');
    const size = parsePage(take ?? limit, 10, 1, 100, 'take');
    const term = (word ?? keyword)?.trim();
    res.json(await ArticleRepository.list(start, size, term));
}));

ArticleRouter.get('/:articleId', asyncErrorHandler(async (req, res) => {
    const id = parseId(req.params.articleId, 'articleId');
    res.json(await ArticleRepository.get(id));
}));

ArticleRouter.patch('/:articleId', asyncErrorHandler(async (req, res) => {
    const id = parseId(req.params.articleId, 'articleId');
    assert(req.body, articlePatch);
    if (Object.keys(req.body).length === 0) {
        throw new BadRequestException('Validation failed', 'Provide a title or content to update.');
    }
    res.json(await ArticleRepository.update(id, req.body));
}));

ArticleRouter.delete('/:articleId', asyncErrorHandler(async (req, res) => {
    const id = parseId(req.params.articleId, 'articleId');
    await ArticleRepository.remove(id);
    res.status(204).end();
}));

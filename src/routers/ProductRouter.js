import express from 'express';
import { create, object } from 'superstruct';

import { asyncErrorHandler } from './utils/asyncErrorHandler.js';
import { ExceptionMessage } from '../constant/ExceptionMessage.js';
import { NotFoundException } from '../exceptions/NotFoundException.js';
import { prisma } from '../config/prisma.js';

import { IdStruct } from './structs/IdStruct.js';
import { CreateProductRequestStruct } from './structs/product/CreateProductRequestStruct.js';
import { UpdateProductRequestStruct } from './structs/product/UpdateProductRequestStruct.js';
import { GetProductListRequestStruct } from './structs/product/GetProductListRequestStruct.js';
import { createCommentHandler, getCommentListHandler } from './CommentRouter.js';

export const ProductRouter = express.Router();

const ProductIdParamStruct = object({ productId: IdStruct });

// 응답에 포함할 필드
const productSelect = {
    id: true,
    name: true,
    description: true,
    price: true,
    tags: true,
    images: true,
    createdAt: true,
    updatedAt: true,
};

// 상품 등록 api
ProductRouter.post(
    '/',
    asyncErrorHandler(async (req, res) => {
        const data = create(req.body, CreateProductRequestStruct);

        const product = await prisma.product.create({ data, select: productSelect });

        return res.status(201).send(product);
    }),
);

// 상품 조회 api
ProductRouter.get(
    '/:productId',
    asyncErrorHandler(async (req, res) => {
        const { productId } = create(req.params, ProductIdParamStruct);

        const product = await prisma.product.findUnique({
            where: { id: productId },
            select: productSelect,
        });

        if (!product) {
            throw new NotFoundException(ExceptionMessage.PRODUCT_NOT_FOUND);
        }

        return res.send(product);
    }),
);

// 상품 수정 api
// 없는 상품이면 prisma 가 P2025 에러를 던지고, asyncErrorHandler 에서 404 로 변환합니다.
ProductRouter.patch(
    '/:productId',
    asyncErrorHandler(async (req, res) => {
        const { productId } = create(req.params, ProductIdParamStruct);
        const data = create(req.body, UpdateProductRequestStruct);

        const product = await prisma.product.update({
            where: { id: productId },
            data,
            select: productSelect,
        });

        return res.send(product);
    }),
);

// 상품 삭제 api (달린 댓글은 onDelete: Cascade 로 함께 삭제됩니다)
ProductRouter.delete(
    '/:productId',
    asyncErrorHandler(async (req, res) => {
        const { productId } = create(req.params, ProductIdParamStruct);

        await prisma.product.delete({ where: { id: productId } });

        return res.status(204).send();
    }),
);

// 상품 목록 조회 api
ProductRouter.get(
    '/',
    asyncErrorHandler(async (req, res) => {
        const { skip, take, orderBy, word } = create(req.query, GetProductListRequestStruct);

        const where = word
            ? {
                  OR: [
                      { name: { contains: word, mode: 'insensitive' } },
                      { description: { contains: word, mode: 'insensitive' } },
                  ],
              }
            : undefined;

        const [count, data] = await Promise.all([
            prisma.product.count({ where }),
            prisma.product.findMany({
                where,
                orderBy: orderBy === 'recent' ? { createdAt: 'desc' } : { id: 'asc' },
                skip,
                take,
                select: productSelect,
            }),
        ]);

        return res.send({ count, data });
    }),
);

// 중고마켓 댓글 등록 / 목록 조회 api
ProductRouter.post('/:productId/comments', createCommentHandler('product'));
ProductRouter.get('/:productId/comments', getCommentListHandler('product'));

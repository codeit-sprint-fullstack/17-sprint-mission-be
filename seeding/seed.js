import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: path.join(path.resolve(), '.env') });

import { prisma } from '../src/config/prisma.js';
import { products, articles } from './seedData.js';

const toComments = (contents) => ({ create: contents.map((content) => ({ content })) });

async function seed() {
    // 상품/게시글을 지우면 댓글도 onDelete: Cascade 로 함께 지워집니다.
    await prisma.product.deleteMany();
    await prisma.article.deleteMany();

    for (const { comments, ...product } of products) {
        await prisma.product.create({ data: { ...product, comments: toComments(comments) } });
    }
    for (const { comments, ...article } of articles) {
        await prisma.article.create({ data: { ...article, comments: toComments(comments) } });
    }

    console.log('seed 완료');
}

seed()
    .catch((e) => {
        console.error(e);
        process.exitCode = 1;
    })
    .finally(() => prisma.$disconnect());

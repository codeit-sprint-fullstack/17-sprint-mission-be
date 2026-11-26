import { prisma } from '../db.js';

const productFields = {
    id: true,
    name: true,
    description: true,
    price: true,
    tags: true,
    images: true,
    createdAt: true,
    updatedAt: true,
};

export const ProductRepository = {
    create(data) {
        return prisma.product.create({ data, select: productFields });
    },

    findById(id) {
        return prisma.product.findUnique({ where: { id }, select: productFields });
    },

    update(id, data) {
        return prisma.product.update({ where: { id }, data, select: productFields });
    },

    remove(id) {
        return prisma.product.delete({ where: { id }, select: { id: true } });
    },

    async list({ skip, take, word, orderBy }) {
        // 검색어의 LIKE 특수문자 이스케이프
        const literal = word?.replace(/[\\%_]/g, '\\$&');
        const search = { contains: literal, mode: 'insensitive' };
        const where = word ? { OR: [{ name: search }, { description: search }] } : {};
        const sort = orderBy === 'recent' ? [{ createdAt: 'desc' }, { id: 'desc' }] : { id: 'asc' };
        const [count, data] = await prisma.$transaction(
            [
                prisma.product.count({ where }),
                prisma.product.findMany({ where, orderBy: sort, skip, take, select: productFields }),
            ],
            { isolationLevel: 'RepeatableRead' },
        );
        return { count, data };
    },
};

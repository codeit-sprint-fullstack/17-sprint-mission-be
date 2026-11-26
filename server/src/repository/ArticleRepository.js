import { prisma } from '../db.js';

const articleFields = { id: true, title: true, content: true, createdAt: true };

export const ArticleRepository = {
    create(data) {
        return prisma.article.create({ data });
    },

    get(id) {
        return prisma.article.findUniqueOrThrow({ where: { id }, select: articleFields });
    },

    update(id, data) {
        return prisma.article.update({ where: { id }, data });
    },

    remove(id) {
        return prisma.article.delete({ where: { id } });
    },

    async list(skip, take, term) {
        // 검색어의 LIKE 특수문자 이스케이프
        const contains = term?.replace(/[\\%_]/g, '\\$&');
        const match = { contains, mode: 'insensitive' };
        const where = contains ? { OR: [{ title: match }, { content: match }] } : {};
        const [count, data] = await prisma.$transaction([
            prisma.article.count({ where }),
            prisma.article.findMany({
                where,
                select: articleFields,
                orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
                skip,
                take,
            }),
        ], { isolationLevel: 'RepeatableRead' });
        return { count, data };
    },
};

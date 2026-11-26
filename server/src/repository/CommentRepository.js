import { prisma } from '../db.js';
import { BadRequestException } from '../exceptions/BadRequestException.js';

const commentFields = { id: true, content: true, createdAt: true };

export const CommentRepository = {
    create(parentModel, parentId, content) {
        return prisma.comment.create({
            data: { content, [parentModel]: { connect: { id: parentId } } },
            select: commentFields,
        });
    },

    update(id, content) {
        return prisma.comment.update({ where: { id }, data: { content }, select: commentFields });
    },

    remove(id) {
        return prisma.comment.delete({ where: { id } });
    },

    list(parentModel, parentId, size, afterId) {
        const parentKey = parentModel + 'Id';
        return prisma.$transaction(async tx => {
            await tx[parentModel].findUniqueOrThrow({ where: { id: parentId }, select: { id: true } });
            const where = { [parentKey]: parentId };

            if (afterId !== undefined) {
                const anchor = await tx.comment.findUnique({
                    where: { id: afterId },
                    select: { [parentKey]: true },
                });
                if (anchor && anchor[parentKey] !== parentId) {
                    throw new BadRequestException('Invalid cursor', 'This cursor belongs to a different comment thread.');
                }
                // 마지막 댓글 삭제 후에도 페이지 조회
                where.id = { lt: afterId };
            }

            const rows = await tx.comment.findMany({
                where, select: commentFields, orderBy: { id: 'desc' }, take: size + 1,
            });
            const hasMore = rows.length > size;
            const list = rows.slice(0, size);
            return { list, nextCursor: hasMore ? list[list.length - 1].id : null };
        }, { isolationLevel: 'RepeatableRead' });
    },
};

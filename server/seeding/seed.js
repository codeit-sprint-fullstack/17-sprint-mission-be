import { prisma } from '../src/db.js';
import { seedData } from './seedData.js';

try {
    await prisma.$transaction(async (tx) => {
        const marker = await tx.seedVersion.createMany({ data: [{ version: 'mission-6-v1' }], skipDuplicates: true });
        if (!marker.count) return;
        const [first, ...rest] = seedData;
        const product = await tx.product.create({ data: first });
        await tx.product.createMany({ data: rest });
        const article = await tx.article.create({ data: { title: '첫 거래를 준비해요', content: '직거래를 할 때 어떤 점을 확인하시나요?' } });
        await tx.comment.createMany({ data: [
            { productId: product.id, content: '이 상품은 아직 구매할 수 있나요?' },
            { articleId: article.id, content: '저는 만날 장소와 시간을 먼저 정해요.' },
        ] });
    });
    console.log('Seed complete');
} catch {
    console.error('Seed failed. Check the database connection and migrations.');
    process.exitCode = 1;
} finally {
    await prisma.$disconnect();
}

import 'dotenv/config';
import prisma from '../src/lib/prisma.js';

const START = new Date('2026-11-01T09:00:00+09:00').getTime();
const minutesAfter = (minutes) => new Date(START + minutes * 60 * 1000);

const products = [
    ['태블릿', '거의 새것 같은 태블릿이에요.', 450000, ['전자기기']],
    [
        '무선 이어폰',
        '한 달 사용한 무선 이어폰이에요.',
        90000,
        ['전자기기', '음향'],
    ],
    ['기계식 키보드', '청축 기계식 키보드 팝니다.', 60000, ['전자기기']],
    ['원목 책상', '이사 때문에 내놓는 원목 책상이에요.', 70000, ['가구']],
    ['사무용 의자', '높이 조절이 되는 의자예요.', 35000, ['가구']],
    ['겨울 패딩', '두 번 입은 겨울 패딩이에요.', 55000, ['의류']],
    ['운동화', '사이즈가 안 맞아서 판매해요.', 40000, ['의류', '신발']],
    ['자전거', '출퇴근용으로 타던 자전거예요.', 120000, ['스포츠']],
    ['캠핑 랜턴', '밝기 조절이 되는 랜턴이에요.', 18000, ['캠핑']],
    ['소설책 세트', '깨끗하게 읽은 소설책 세트예요.', 25000, ['도서']],
].map(([name, description, price, tags], index) => ({
    name,
    description,
    price,
    tags,
    createdAt: minutesAfter(index),
}));

const TOPICS = [
    '중고거래 팁',
    '직거래 후기',
    '판다마켓 첫 이용',
    '택배 포장 방법',
    '사기 예방 방법',
];

const articles = Array.from({ length: 25 }, (_, index) => {
    const topic = TOPICS[index % TOPICS.length];
    return {
        title: `${topic} ${index + 1}`,
        content: `${topic}에 대한 ${index + 1}번째 이야기예요.`,
        createdAt: minutesAfter(index),
    };
});

function makeComments(parent, label) {
    return Array.from({ length: 25 }, (_, index) => ({
        ...parent,
        content: `${label} 댓글 ${index + 1}`,
        createdAt: minutesAfter(60 + index),
    }));
}

const comments = [
    ...makeComments({ productId: 1 }, '상품'),
    ...makeComments({ articleId: 1 }, '게시글'),
];

try {
    await prisma.$transaction([
        prisma.$executeRaw`TRUNCATE TABLE "Comment", "Article", "Product" RESTART IDENTITY`,
        prisma.product.createMany({ data: products }),
        prisma.article.createMany({ data: articles }),
        prisma.comment.createMany({ data: comments }),
    ]);
    console.log(
        `시딩 완료: 상품 ${products.length}개, 게시글 ${articles.length}개, 댓글 ${comments.length}개`,
    );
} finally {
    await prisma.$disconnect();
}

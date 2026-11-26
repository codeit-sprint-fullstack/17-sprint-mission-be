import "dotenv/config";
import prisma from "../src/config/prisma.js";

async function main() {
  console.log("시딩을 시작합니다...");

  // 1. 기존 시드 데이터가 있으면 중복 생성 방지를 위해 먼저 정리
  await prisma.comment.deleteMany();
  await prisma.product.deleteMany();
  await prisma.article.deleteMany();

  // 2. 중고마켓 상품 샘플 데이터 생성
  const product1 = await prisma.product.create({
    data: {
      name: "무선 키보드",
      description:
        "거의 새것 같은 기계식 무선 키보드입니다. 직거래 환영합니다.",
      price: 55000,
      tags: ["전자기기", "키보드", "무선"],
    },
  });

  const product2 = await prisma.product.create({
    data: {
      name: "캠핑 의자",
      description: "가볍고 수납하기 편한 접이식 캠핑 의자 2개 세트입니다.",
      price: 32000,
      tags: ["캠핑", "의자", "아웃도어"],
    },
  });

  // 3. 자유게시판 게시글 샘플 데이터 생성
  const article1 = await prisma.article.create({
    data: {
      title: "중고거래 직거래 시 주의할 점 공유해요",
      content:
        "고가의 전자기기나 물품을 직거래할 때는 밝은 곳에서 상태를 꼼꼼히 확인하는 것이 좋습니다.",
    },
  });

  const article2 = await prisma.article.create({
    data: {
      title: "판다마켓 자유게시판 첫 글입니다",
      content: "반갑습니다! 자유롭게 질문이나 정보를 남겨주세요.",
    },
  });

  // 4. 상품 댓글 샘플 데이터 생성 (cursor 페이지네이션 테스트용으로 여러 개 생성)
  await prisma.comment.createMany({
    data: [
      { content: "혹시 택배 거래도 가능한가요?", productId: product1.id },
      { content: "스위치 종류가 무엇인가요?", productId: product1.id },
      { content: "오늘 바로 거래 가능할까요?", productId: product1.id },
      { content: "의자 상태 깨끗해 보이네요!", productId: product2.id },
    ],
  });

  // 5. 자유게시판 댓글 샘플 데이터 생성
  await prisma.comment.createMany({
    data: [
      { content: "좋은 팁 감사합니다!", articleId: article1.id },
      { content: "초보자한테 꼭 필요한 정보네요.", articleId: article1.id },
      { content: "환영합니다~ 자주 글 올려주세요.", articleId: article2.id },
    ],
  });

  console.log("시딩이 완료되었습니다.");
}

main()
  .catch((error) => {
    console.error("시딩 중 오류가 발생했습니다:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

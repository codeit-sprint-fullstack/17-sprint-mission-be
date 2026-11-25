import "dotenv/config";
import { sequelize, syncDatabase } from "./db.js";
import { Article, Comment, Product } from "./models/index.js";

const TARGET_PRODUCTS = 50;
const productTypes = [
  { name: "로봇 청소기", price: 1_500_000, tags: ["가전", "청소기"] },
  { name: "무선 이어폰", price: 89_000, tags: ["음향", "이어폰"] },
  { name: "원목 책상", price: 210_000, tags: ["가구", "책상"] },
  { name: "커피 머신", price: 135_000, tags: ["주방", "커피"] },
  { name: "캠핑 의자", price: 45_000, tags: ["캠핑", "의자"] },
  { name: "스마트 워치", price: 179_000, tags: ["전자", "시계"] },
  { name: "판다 티셔츠", price: 28_000, tags: ["의류", "티셔츠"] },
  { name: "블투 스피커", price: 72_000, tags: ["음향", "스피커"] },
  { name: "여행 캐리어", price: 99_000, tags: ["여행", "가방"] },
  { name: "키보드", price: 110_000, tags: ["컴퓨터", "키보드"] },
];
const descriptions = [
  "깨끗하게 사용한 상품입니다. 편하게 문의해 주세요.",
  "사용감이 적고 상태가 좋아요. 빠르게 거래하고 싶습니다.",
  "구성품 모두 포함되어 있어요. 사진과 같은 상태입니다.",
  "필요하신 분께 저렴하게 판매합니다. 직거래도 가능합니다.",
  "최근까지 문제없이 사용했으며 꼼꼼히 포장해 드릴게요.",
];
const sampleArticles = [
  { title: "첫 번째 자유게시판 글", content: "판다마켓 자유게시판에 오신 것을 환영합니다." },
  { title: "중고거래 팁을 공유해요", content: "상품 사진과 설명을 자세히 적으면 거래에 도움이 됩니다." },
  { title: "오늘의 거래 후기", content: "친절한 거래 상대를 만나 기분 좋은 거래를 마쳤어요." },
];

try {
  await syncDatabase();

  for (let index = 0; index < TARGET_PRODUCTS; index += 1) {
    const type = productTypes[index % productTypes.length];
    const number = String(index + 1).padStart(2, "0");
    await Product.findOrCreate({
      where: { name: `${type.name} ${number}` },
      defaults: {
        description: descriptions[index % descriptions.length],
        price: type.price + Math.floor(index / productTypes.length) * 5_000,
        tags: type.tags,
        favoriteCount: ((index * 37) % 250) + 1,
      },
    });
  }

  const articles = [];
  for (const articleData of sampleArticles) {
    const [article] = await Article.findOrCreate({ where: { title: articleData.title }, defaults: articleData });
    articles.push(article);
  }

  const product = await Product.findOne({ order: [["id", "ASC"]] });
  if (product) {
    const content = "상품 상태가 좋은가요?";
    await Comment.findOrCreate({ where: { productId: product.id, content }, defaults: { productId: product.id, content } });
  }
  if (articles[0]) {
    const content = "좋은 정보 감사합니다!";
    await Comment.findOrCreate({ where: { articleId: articles[0].id, content }, defaults: { articleId: articles[0].id, content } });
  }

  console.log(`시딩을 완료했습니다. 상품 ${await Product.count()}개, 게시글 ${await Article.count()}개입니다.`);
} catch (error) {
  console.error("데이터 시딩에 실패했습니다.", error);
  process.exitCode = 1;
} finally {
  await sequelize.close();
}

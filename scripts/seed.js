import 'dotenv/config';
import mongoose from 'mongoose';
import Product from '../src/models/Product.js';

const names = ['아이패드', '맥북 프로', '갤럭시 S24', '에어팟', '닌텐도', '캠핑의자', '전기포트', '무드등', '키보드', '모니터', '자전거', '책상', '운동화', '백팩', '선풍기'];
const tagPool = ['전자제품', '중고', '새상품', '생활', '스포츠', '가구', '패션'];

const products = Array.from({ length: 30 }, (_, i) => ({
  name: names[i % names.length],
  description: `${names[i % names.length]} 판매합니다. 상태 좋아요. 직거래 선호해요.`,
  price: (i + 1) * 10000,
  tags: [tagPool[i % tagPool.length], tagPool[(i + 3) % tagPool.length]],
  favoriteCount: (i * 7) % 50,
  createdAt: new Date(Date.now() - i * 60 * 60 * 1000),
}));

await mongoose.connect(process.env.DB_CONNECT);
await Product.deleteMany({});
await Product.insertMany(products);
console.log(`상품 ${products.length}개를 넣었어요.`);
await mongoose.disconnect();

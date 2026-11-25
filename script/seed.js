import mongoose from 'mongoose';
import 'dotenv/config';
import { Product } from '../models/Product.js';

const products = [
  { name: '아이패드 미니', description: '거의 사용하지 않은 아이패드 미니입니다.', price: 450000, tags: ['애플', '태블릿'], favoriteCount: 12 },
  { name: '맥북 에어 M2', description: '배터리 상태 좋은 맥북 에어 판매합니다.', price: 1100000, tags: ['애플', '노트북'], favoriteCount: 30 },
  { name: '갤럭시 버즈', description: '케이스까지 깨끗한 갤럭시 버즈입니다.', price: 60000, tags: ['삼성', '이어폰'], favoriteCount: 5 },
  { name: '닌텐도 스위치', description: '게임 칩 2개 포함해서 드립니다.', price: 250000, tags: ['게임'], favoriteCount: 21 },
  { name: '캠핑 의자', description: '두 번 사용한 접이식 캠핑 의자입니다.', price: 30000, tags: ['캠핑', '의자'], favoriteCount: 3 },
  { name: '원목 책상', description: '이사로 급하게 처분하는 원목 책상입니다.', price: 80000, tags: ['가구'], favoriteCount: 8 },
  { name: '전기 자전거', description: '출퇴근용으로 좋은 전기 자전거입니다.', price: 600000, tags: ['자전거'], favoriteCount: 17 },
  { name: '에어팟 프로', description: '정품 등록된 에어팟 프로 2세대입니다.', price: 180000, tags: ['애플', '이어폰'], favoriteCount: 25 },
  { name: '기계식 키보드', description: '갈축 기계식 키보드, 키캡 교체했습니다.', price: 70000, tags: ['키보드'], favoriteCount: 9 },
  { name: '무선 마우스', description: '조용한 클릭음의 무선 마우스입니다.', price: 20000, tags: ['마우스'], favoriteCount: 2 },
  { name: '블루투스 스피커', description: '캠핑 갈 때 쓰기 좋은 스피커입니다.', price: 45000, tags: ['음향'], favoriteCount: 6 },
  { name: '필름 카메라', description: '작동 확인 완료된 필름 카메라입니다.', price: 150000, tags: ['카메라'], favoriteCount: 14 },
];

await mongoose.connect(process.env.DATABASE_URL);

const result = await Product.insertMany(products);
console.log(`상품 ${result.length}개를 등록했습니다.`);

await mongoose.disconnect();
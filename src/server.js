import 'dotenv/config';
import mongoose from 'mongoose';
import app from './app.js';

const PORT = process.env.PORT ?? 3000;
const { DB_CONNECT } = process.env;

if (!DB_CONNECT) {
  console.error('DB_CONNECT 환경 변수가 없어요. .env 파일을 확인해 주세요.');
  process.exit(1);
}

try {
  await mongoose.connect(DB_CONNECT);
  console.log('MongoDB 연결 성공');
} catch (err) {
  console.error('MongoDB 연결 실패:', err.message);
  process.exit(1);
}

app.listen(PORT, () => {
  console.log(`서버 실행 중: http://localhost:${PORT}`);
});

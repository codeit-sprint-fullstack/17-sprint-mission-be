const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const mongoose = require('mongoose');
const products = require('./routes/Product');

const app = express();
const port = Number(process.env.PORT ?? 3000);
const origins = (process.env.FRONTEND_ORIGIN ?? 'http://localhost:5173')
  .split(',').map(origin => origin.trim()).filter(Boolean);

app.use(morgan('dev'));
app.use(cors({ origin: origins }));
app.use(express.json());
app.get('/api/health', (_req, res) => {
  const connected = mongoose.connection.readyState === 1;
  res.status(connected ? 200 : 503).json({ status: connected ? 'ok' : 'unavailable' });
});
app.use('/api/products', products);
app.use((_req, res) => res.status(404).json({ message: '요청한 API를 찾을 수 없습니다.' }));

app.use((error, _req, res, next) => {
  if (res.headersSent) return next(error);
  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'JSON 형식이 올바르지 않습니다.' });
  }
  if (error.name === 'ValidationError') {
    return res.status(400).json({ message: '상품 입력값을 확인해 주세요.' });
  }
  if (error.status >= 400 && error.status < 500) {
    return res.status(error.status).json({ message: '요청을 처리할 수 없습니다.' });
  }
  console.error(error.name);
  res.status(500).json({ message: '서버 오류가 발생했습니다.' });
});

async function start() {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI가 필요합니다.');
  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
  app.listen(port, '0.0.0.0', () => console.log('API server listening on port ' + port));
}

start().catch(error => {
  console.error(process.env.MONGODB_URI ? 'MongoDB 연결 실패: ' + error.name : error.message);
  process.exitCode = 1;
});

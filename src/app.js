import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import productsRouter from './routes/products.js';
import articlesRouter from './routes/articles.js';
import errorHandler from './middlewares/errorHandler.js';
import commentsRouter from './routes/comments.js';

if (!process.env.DATABASE_URL) {
    console.error('환경 변수 DATABASE_URL이 설정되지 않았습니다.');
    process.exit(1);
}

const allowedOrigins = (process.env.CORS_ORIGINS ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

const app = express();

app.use(cors({ origin: allowedOrigins }));
app.use(express.json());

app.get('/', (req, res) => {
    res.send('판다마켓 API');
});

app.use('/products', productsRouter);

app.use('/articles', articlesRouter);

app.use(commentsRouter);

app.use((req, res) => {
    res.status(404).json({ message: '존재하지 않는 경로입니다.' });
});
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`서버 실행 중 : http://localhost:${PORT}`);
});

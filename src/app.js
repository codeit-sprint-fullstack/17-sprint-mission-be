import express from 'express';
import cors from 'cors';
import productRouter from './routes/productRouter.js';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler.js';

const app = express();

const allowedOrigins = (process.env.CORS_ORIGIN ?? 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins.includes('*') ? '*' : allowedOrigins,
  })
);

app.use(express.json());

app.get('/', (req, res) => {
  res.status(200).json({ message: '판다마켓 API 서버가 동작 중이에요.' });
});

app.use('/products', productRouter);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;

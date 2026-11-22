import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import 'dotenv/config';
import productRouter from './routes/products.js';
import errorHandler from './middlewares/errorHandler.js';
import notFound from './middlewares/notFound.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

app.use(express.json());

app.get('/', (req, res) => {
    res.send('판다마켓 API 서버');
});

app.use('/products', productRouter);
app.use(notFound);
app.use(errorHandler);

await mongoose.connect(process.env.DATABASE_URL);
console.log('mongoDB 연결');

app.listen(PORT, () => {
    console.log(`서버 실행 중: http://localhost:${PORT}`);
});

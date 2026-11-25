import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: path.join(path.resolve(), '.env') });

import express from 'express';
import cors from 'cors';

import { ProductRouter } from './routers/ProductRouter.js';
import { ArticleRouter } from './routers/ArticleRouter.js';
import { CommentRouter } from './routers/CommentRouter.js';
import { errorHandler } from './routers/utils/asyncErrorHandler.js';

const app = express();
app.use(cors());
app.use(express.json());

app.use('/products', ProductRouter);
app.use('/articles', ArticleRouter);
app.use('/comments', CommentRouter);

// 반드시 마지막에 등록해야 합니다.
app.use(errorHandler);

app.listen(process.env.HTTP_PORT || 3000, () => console.log('Server started'));

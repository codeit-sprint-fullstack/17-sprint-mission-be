import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: path.join(path.resolve(), '.env') });

import express from 'express';
import cors from 'cors';

import { ProductRouter } from './routers/ProductRouter.js';
import { ArticleRouter } from './routers/ArticleRouter.js';
import { CommentRouter } from './routers/CommentRouter.js';

const app = express();
app.use(cors());
app.use(express.json());

app.use('/products', ProductRouter);
app.use('/articles', ArticleRouter);
app.use('/comments', CommentRouter);

app.listen(process.env.HTTP_PORT || 3000, () => console.log('Server started'));

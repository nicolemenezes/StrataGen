import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import authRoutes from './routes/authRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import campaignRoutes from './routes/campaignRoutes.js';
import imageRoutes from './routes/imageRoutes.js';
import { errorHandler } from './middleware/errorMiddleware.js';
import { notFound } from './middleware/notFound.js';

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_URL || true,
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

app.get('/health', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'StrataGen backend is running.',
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/images', imageRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;

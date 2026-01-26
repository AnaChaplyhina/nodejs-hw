import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { errors } from 'celebrate'; 
import { connectMongoDB } from './db/connectMongoDB.js';
import notesRoutes from './routes/notesRoutes.js';
import { notFoundHandler } from './middleware/notFoundHandler.js';
import { errorHandler } from './middleware/errorHandler.js';
import { logger } from './middleware/logger.js';

dotenv.config();

const PORT = process.env.PORT || 3000;

const bootstrap = async () => {
  try {
    await connectMongoDB();

    const app = express();

    app.use(logger);
    app.use(cors());
    app.use(express.json());

    app.use(notesRoutes);

    app.use(notFoundHandler);

    app.use(errors());

    app.use(errorHandler);

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
  }
};

bootstrap();

import mongoose from 'mongoose';
import app from './app';
import { env } from './config/env';
import { logger } from './config/logger';

const connectDB = async () => {
    try {
        await mongoose.connect(env.MONGO_URI);
        logger.info('MongoDB Connected via Mongoose');
    } catch (error) {
        logger.error('MongoDB connection error:', error);
        process.exit(1);
    }
};

const startServer = async () => {
    await connectDB();
    app.listen(env.PORT, () => {
        logger.info(`Server running in ${env.NODE_ENV} mode on port ${env.PORT}`);
    });
};

startServer();

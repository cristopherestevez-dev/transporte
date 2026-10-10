import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config();

export const env = {
    PORT: process.env.PORT || 5000,
    MONGO_URI: process.env.MONGODB_URI || 'mongodb://admin:admin123@localhost:27017/transporte?authSource=admin',
    JWT_SECRET: process.env.JWT_SECRET || '',
    SUPERADMIN_EMAIL: (process.env.SUPERADMIN_EMAIL || '').trim().toLowerCase(),
    NODE_ENV: process.env.NODE_ENV || 'development',
};

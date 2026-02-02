import { Request, Response, NextFunction } from 'express';
import { AppError } from './AppError';
import { logger } from '../../config/logger';

export const globalErrorHandler = (
    err: AppError | Error,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    let statusCode = 500;
    let message = 'Internal Server Error';

    if (err instanceof AppError) {
        statusCode = err.statusCode;
        message = err.message;
    } else {
        console.error('=== UNEXPECTED ERROR ===');
        console.error(err);
        console.error('========================');
        logger.error('Unexpected Error', err);
    }

    res.status(statusCode).json({
        status: 'error',
        message,
    });
};

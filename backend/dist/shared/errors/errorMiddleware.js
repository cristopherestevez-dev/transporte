"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.globalErrorHandler = void 0;
const AppError_1 = require("./AppError");
const logger_1 = require("../../config/logger");
const globalErrorHandler = (err, req, res, next) => {
    let statusCode = 500;
    let message = 'Internal Server Error';
    if (err instanceof AppError_1.AppError) {
        statusCode = err.statusCode;
        message = err.message;
    }
    else {
        console.error('=== UNEXPECTED ERROR ===');
        console.error(err);
        console.error('========================');
        logger_1.logger.error('Unexpected Error', err);
    }
    res.status(statusCode).json({
        status: 'error',
        message,
    });
};
exports.globalErrorHandler = globalErrorHandler;

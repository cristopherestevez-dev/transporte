"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateToken = exports.optionalAuthMiddleware = exports.authMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const AppError_1 = require("../errors/AppError");
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-change-in-production';
const authMiddleware = (req, res, next) => {
    try {
        // Obtener token del header Authorization
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            throw new AppError_1.AppError('Token de autenticación no proporcionado', 401);
        }
        // Verificar formato "Bearer <token>"
        const parts = authHeader.split(' ');
        if (parts.length !== 2 || parts[0] !== 'Bearer') {
            throw new AppError_1.AppError('Formato de token inválido. Use: Bearer <token>', 401);
        }
        const token = parts[1];
        // Verificar y decodificar token
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        // Agregar usuario a la request
        req.user = decoded;
        next();
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            next(new AppError_1.AppError('Token expirado. Por favor, inicie sesión nuevamente', 401));
        }
        else if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            next(new AppError_1.AppError('Token inválido', 401));
        }
        else if (error instanceof AppError_1.AppError) {
            next(error);
        }
        else {
            next(new AppError_1.AppError('Error de autenticación', 401));
        }
    }
};
exports.authMiddleware = authMiddleware;
// Middleware opcional - no falla si no hay token
const optionalAuthMiddleware = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (authHeader) {
            const parts = authHeader.split(' ');
            if (parts.length === 2 && parts[0] === 'Bearer') {
                const token = parts[1];
                const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
                req.user = decoded;
            }
        }
        next();
    }
    catch (error) {
        // Si hay error, simplemente continuamos sin usuario
        next();
    }
};
exports.optionalAuthMiddleware = optionalAuthMiddleware;
// Helper para generar tokens
const generateToken = (payload, expiresIn = '7d') => {
    return jsonwebtoken_1.default.sign(payload, JWT_SECRET, { expiresIn });
};
exports.generateToken = generateToken;

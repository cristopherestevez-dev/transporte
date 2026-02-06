import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from '../errors/AppError';

export interface JwtPayload {
    userId: string;
    email: string;
    role?: string;
}

export interface AuthRequest extends Request {
    user?: JwtPayload;
}

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-change-in-production';

export const authMiddleware = (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        // Obtener token del header Authorization
        const authHeader = req.headers.authorization;
        
        if (!authHeader) {
            throw new AppError('Token de autenticación no proporcionado', 401);
        }

        // Verificar formato "Bearer <token>"
        const parts = authHeader.split(' ');
        if (parts.length !== 2 || parts[0] !== 'Bearer') {
            throw new AppError('Formato de token inválido. Use: Bearer <token>', 401);
        }

        const token = parts[1];

        // Verificar y decodificar token
        const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
        
        // Agregar usuario a la request
        req.user = decoded;
        
        next();
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            next(new AppError('Token expirado. Por favor, inicie sesión nuevamente', 401));
        } else if (error instanceof jwt.JsonWebTokenError) {
            next(new AppError('Token inválido', 401));
        } else if (error instanceof AppError) {
            next(error);
        } else {
            next(new AppError('Error de autenticación', 401));
        }
    }
};

// Middleware opcional - no falla si no hay token
export const optionalAuthMiddleware = (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (authHeader) {
            const parts = authHeader.split(' ');
            if (parts.length === 2 && parts[0] === 'Bearer') {
                const token = parts[1];
                const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
                req.user = decoded;
            }
        }
        
        next();
    } catch (error) {
        // Si hay error, simplemente continuamos sin usuario
        next();
    }
};

// Helper para generar tokens
export const generateToken = (payload: JwtPayload, expiresIn: string = '7d'): string => {
    return jwt.sign(payload, JWT_SECRET, { expiresIn } as jwt.SignOptions);
};

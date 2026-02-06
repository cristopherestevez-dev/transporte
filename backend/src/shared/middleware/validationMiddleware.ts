import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { AppError } from '../errors/AppError';

type ValidationTarget = 'body' | 'query' | 'params';

/**
 * Middleware genérico para validar requests con Zod
 */
export const validate = (schema: ZodSchema, target: ValidationTarget = 'body') => {
    return (req: Request, res: Response, next: NextFunction) => {
        try {
            const dataToValidate = req[target];
            const validated = schema.parse(dataToValidate);
            
            // Reemplazar datos con datos validados/transformados
            req[target] = validated;
            
            next();
        } catch (error: unknown) {
            if (error instanceof ZodError) {
                const errorMessages = error.issues.map((issue) => ({
                    field: issue.path.join('.'),
                    message: issue.message,
                }));
                
                return res.status(400).json({
                    status: 'error',
                    message: 'Error de validación',
                    errors: errorMessages,
                });
            }
            next(error);
        }
    };
};

/**
 * Helpers para validar diferentes partes del request
 */
export const validateBody = (schema: ZodSchema) => validate(schema, 'body');
export const validateQuery = (schema: ZodSchema) => validate(schema, 'query');
export const validateParams = (schema: ZodSchema) => validate(schema, 'params');

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateParams = exports.validateQuery = exports.validateBody = exports.validate = void 0;
const zod_1 = require("zod");
/**
 * Middleware genérico para validar requests con Zod
 */
const validate = (schema, target = 'body') => {
    return (req, res, next) => {
        try {
            const dataToValidate = req[target];
            const validated = schema.parse(dataToValidate);
            // Reemplazar datos con datos validados/transformados
            req[target] = validated;
            next();
        }
        catch (error) {
            if (error instanceof zod_1.ZodError) {
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
exports.validate = validate;
/**
 * Helpers para validar diferentes partes del request
 */
const validateBody = (schema) => (0, exports.validate)(schema, 'body');
exports.validateBody = validateBody;
const validateQuery = (schema) => (0, exports.validate)(schema, 'query');
exports.validateQuery = validateQuery;
const validateParams = (schema) => (0, exports.validate)(schema, 'params');
exports.validateParams = validateParams;

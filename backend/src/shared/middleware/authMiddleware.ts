import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from '../errors/AppError';
import { env } from '../../config/env';
import { Usuario, perfilesAsignados } from '../../modules/usuarios/usuarios.model';
import { tenantContext } from '../tenant';
import { EmpresaOperadora } from '../../modules/usuarios/empresas.model';
import { permisosPorPerfil } from '../../modules/usuarios/perfiles.service';

export interface JwtPayload {
    email: string;
    purpose: 'session' | 'sync' | 'login';
    perfil?: string;
    empresaId?: string;
    userId?: string;
    role?: string;
    permisos?: string[];
}
export interface AuthRequest extends Request { user?: JwtPayload; }

function readToken(req: Request): JwtPayload {
    if (!env.JWT_SECRET) throw new AppError('Autenticación no configurada', 503);
    const parts = req.headers.authorization?.split(' ');
    if (!parts || parts.length !== 2 || parts[0] !== 'Bearer') throw new AppError('Autenticación requerida', 401);
    try {
        const payload = jwt.verify(parts[1], env.JWT_SECRET, {
            algorithms: ['HS256'], issuer: 'transporte-frontend', audience: 'transporte-api',
        });
        if (typeof payload === 'string' || typeof payload.email !== 'string' || !payload.email) throw new Error('Invalid identity');
        return payload as JwtPayload;
    } catch {
        throw new AppError('Credencial inválida o expirada', 401);
    }
}

export const syncAuthMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const payload = readToken(req);
        if (payload.purpose !== 'sync' || payload.email.toLowerCase() !== req.body.email?.toLowerCase()) {
            throw new AppError('Operación no permitida', 403);
        }
        req.user = payload;
        next();
    } catch (error) { next(error); }
};

export const authMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const payload = readToken(req);
        if (payload.purpose !== 'session') throw new AppError('Operación no permitida', 403);
        const user = await Usuario.findOne({ email: payload.email.toLowerCase() });
        const identityRequest = req.path?.startsWith('/permisos/') || req.path === '/mi-solicitud' || req.path === '/empresas-disponibles';
        if (!user || (!identityRequest && (!user.activo || user.estado === 'pendiente' || user.estado === 'rechazado'))) throw new AppError('Usuario pendiente, inactivo o inexistente', 403);
        const perfiles = perfilesAsignados(user);
        if (payload.perfil !== undefined && !perfiles.includes(payload.perfil as any)) {
            throw new AppError('El perfil seleccionado no está asignado a tu usuario', 403);
        }
        const perfil = payload.perfil || perfiles[0];
        const permissions = await permisosPorPerfil(user.empresaId);
        const permisos = perfil ? permissions[perfil] || [] : [];
        const empresaId = user.empresaId;
        const superAdmin = !empresaId && perfiles.includes('operador_seguridad') && user.estado !== 'pendiente';
        if (empresaId && !identityRequest && !await EmpresaOperadora.exists({ _id: empresaId, activo: true })) throw new AppError('Empresa inactiva o inexistente', 403);
        req.user = { ...payload, userId: user._id.toString(), empresaId, role: perfil, permisos };
        tenantContext.run({ empresaId, userId: user._id.toString(), superAdmin }, () => next());
    } catch (error) { next(error); }
};

export const requirePermission = (...permissions: string[]) => (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!permissions.some(permission => req.user?.permisos?.includes(permission))) {
        return next(new AppError('No tenés permisos para esta operación', 403));
    }
    next();
};

export const requireSecurityProfile = (req: AuthRequest, res: Response, next: NextFunction) => {
    if (req.user?.role !== 'operador_seguridad') return next(new AppError('Seleccioná el perfil de seguridad para administrar permisos', 403));
    next();
};

export const loginAuthMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const payload = readToken(req);
        if (payload.purpose !== 'login' || payload.email.toLowerCase() !== req.body.email?.toLowerCase()) throw new AppError('Operación no permitida', 403);
        next();
    } catch (error) { next(error); }
};

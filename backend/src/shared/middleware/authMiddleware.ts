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
        const identityRequest = req.path?.startsWith('/permisos/') || req.path === '/mi-solicitud' || req.path === '/mi-empresa';
        if (!user || (!identityRequest && (!user.activo || user.estado === 'pendiente' || user.estado === 'rechazado'))) throw new AppError('Usuario pendiente, inactivo o inexistente', 403);
        const perfiles = perfilesAsignados(user);
        if (!identityRequest && payload.perfil !== undefined && !perfiles.includes(payload.perfil as any)) {
            throw new AppError('El perfil seleccionado no está asignado a tu usuario', 403);
        }
        const permissions = await permisosPorPerfil(user.empresaId);
        const preferred = payload.perfil || user.perfil || perfiles[0];
        const perfil = identityRequest ? (preferred && perfiles.includes(preferred) && permissions[preferred] ? preferred : perfiles.find(value => permissions[value])) : preferred;
        const permisos = perfil ? permissions[perfil] || [] : [];
        const empresaId = user.empresaId;
        // Platform administration is reserved to the configured owner, independently of company security.
        const superAdmin = perfil === 'superadmin' && !!env.SUPERADMIN_EMAIL && user.email.toLowerCase() === env.SUPERADMIN_EMAIL;
        if (!identityRequest && perfil === 'superadmin' && !superAdmin) throw new AppError('Superadmin está reservado al dueño de la plataforma', 403);
        if (empresaId && !identityRequest && !await EmpresaOperadora.exists({ _id: empresaId, activo: true })) throw new AppError('Servicio suspendido. Contactá al administrador de tu empresa para regularizar el servicio', 403, 'SERVICE_SUSPENDED');
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
    if (req.user?.role === 'superadmin' && tenantContext.getStore()?.superAdmin) return next();
    if (req.user?.role !== 'operador_seguridad' || !req.user.empresaId) return next(new AppError('Seleccioná Seguridad de tu empresa para administrar sus usuarios', 403));
    next();
};

export const loginAuthMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const payload = readToken(req);
        if (payload.purpose !== 'login' || payload.email.toLowerCase() !== req.body.email?.toLowerCase()) throw new AppError('Operación no permitida', 403);
        next();
    } catch (error) { next(error); }
};

import { Router, Response } from 'express';
import { authMiddleware, AuthRequest, requirePermission, requireSecurityProfile } from '../../shared/middleware/authMiddleware';
import { asyncHandler } from '../../shared/asyncHandler';
import { AppError } from '../../shared/errors/AppError';
import { EmpresaOperadora } from './empresas.model';

export function validarLogo(logo: unknown) {
    if (typeof logo !== 'string') throw new AppError('Elegí un logo PNG o JPG', 400);
    const match = /^data:image\/(png|jpeg);base64,([A-Za-z0-9+/]+={0,2})$/.exec(logo);
    if (!match) throw new AppError('Elegí un logo PNG o JPG', 400);
    const bytes = Buffer.from(match[2], 'base64');
    if (!bytes.length || bytes.length > 1024 * 1024) throw new AppError('El logo debe tener como máximo 1 MB', 400);
    const valid = match[1] === 'png' ? bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) : bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
    if (!valid) throw new AppError('El contenido del logo no corresponde a una imagen PNG o JPG', 400);
    return logo;
}
export const empresaPerfilRoutes = Router();
empresaPerfilRoutes.get('/empresa/perfil', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user?.empresaId) throw new AppError('Tu cuenta no tiene una empresa vinculada', 403);
    const company = await EmpresaOperadora.findById(req.user.empresaId).select('nombre codigo +logo');
    if (!company) throw new AppError('Empresa no encontrada', 404);
    res.json({ status: 'success', data: company });
}));
empresaPerfilRoutes.patch('/empresa/perfil', authMiddleware, requirePermission('configuracion'), requireSecurityProfile, asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user?.empresaId) throw new AppError('Tu cuenta no tiene una empresa vinculada', 403);
    const logo = validarLogo(req.body.logo);
    const company = await EmpresaOperadora.findByIdAndUpdate(req.user.empresaId, { $set: { logo } }, { new: true, runValidators: true }).select('nombre codigo +logo');
    if (!company) throw new AppError('Empresa no encontrada', 404);
    res.json({ status: 'success', data: company });
}));

import { Request, Response, NextFunction } from 'express';
import { UsuariosService } from './usuarios.service';

const usuariosService = new UsuariosService();

export class UsuariosController {
    // Obtener todos los usuarios
    getAll = async (req: Request, res: Response, next: NextFunction) => {
        const usuarios = await usuariosService.getAll();
        res.status(200).json({
            status: 'success',
            results: usuarios.length,
            data: usuarios,
        });
    };

    // Obtener usuario por ID
    getOne = async (req: Request, res: Response, next: NextFunction) => {
        const usuario = await usuariosService.getById(req.params.id);
        res.status(200).json({
            status: 'success',
            data: usuario,
        });
    };

    // Obtener permisos por email (usado por NextAuth)
    getPermisosByEmail = async (req: Request, res: Response, next: NextFunction) => {
        const email = req.params.email;
        const usuario = await usuariosService.getByEmail(email);
        
        if (!usuario) {
            return res.status(200).json({
                status: 'success',
                data: { perfil: null, permisos: [] },
            });
        }
        
        res.status(200).json({
            status: 'success',
            data: {
                perfil: usuario.perfil,
                permisos: usuario.permisos,
            },
        });
    };

    // Sincronizar usuario desde Google OAuth
    sync = async (req: Request, res: Response, next: NextFunction) => {
        const { email, nombre, imagen } = req.body;
        
        if (!email || !nombre) {
            return res.status(400).json({
                status: 'error',
                message: 'Email y nombre son requeridos',
            });
        }
        
        const usuario = await usuariosService.syncFromGoogle({ email, nombre, imagen });
        res.status(200).json({
            status: 'success',
            data: usuario,
        });
    };

    // Asignar perfil a usuario
    asignarPerfil = async (req: Request, res: Response, next: NextFunction) => {
        const { email, perfil } = req.body;
        
        if (!email || !perfil) {
            return res.status(400).json({
                status: 'error',
                message: 'Email y perfil son requeridos',
            });
        }
        
        const usuario = await usuariosService.asignarPerfil(email, perfil);
        
        if (!usuario) {
            return res.status(404).json({
                status: 'error',
                message: 'Usuario no encontrado',
            });
        }
        
        res.status(200).json({
            status: 'success',
            data: usuario,
        });
    };

    // Actualizar usuario
    update = async (req: Request, res: Response, next: NextFunction) => {
        const usuario = await usuariosService.update(req.params.id, req.body);
        res.status(200).json({
            status: 'success',
            data: usuario,
        });
    };

    // Eliminar usuario
    delete = async (req: Request, res: Response, next: NextFunction) => {
        await usuariosService.delete(req.params.id);
        res.status(204).json({
            status: 'success',
            data: null,
        });
    };
}

import { empresasAdministrables, crearEmpresa, solicitarEmpresa, vincularDatosAnteriores } from './empresas.service';
import { EmpresaOperadora } from './empresas.model';
import { Request, Response, NextFunction } from 'express';
import { perfilesAsignados } from './usuarios.model';
import { permisosPorPerfil, actualizarPermisosPerfil, PERMISOS_DISPONIBLES, definicionesPerfiles, crearPerfil, eliminarPerfil } from './perfiles.service';
import { UsuariosService } from './usuarios.service';

const usuariosService = new UsuariosService();

export class UsuariosController {
    createPerfil = async (req: Request, res: Response) => { const profile = await crearPerfil(req.body.perfil, req.body.nombre, req.body.permisos, (req as any).user.email); res.status(201).json({ status: 'success', data: profile }); };
    deletePerfil = async (req: Request, res: Response) => { await eliminarPerfil(req.params.perfil, (req as any).user.email); res.status(204).send(); };
    getEmpresas = async (req: Request, res: Response) => { res.json({ status: 'success', data: await empresasAdministrables() }); };
    createEmpresa = async (req: Request, res: Response) => { res.status(201).json({ status: 'success', data: await crearEmpresa(req.body, (req as any).user.email) }); };
    solicitarEmpresa = async (req: Request, res: Response) => { const user = await solicitarEmpresa((req as any).user.userId, req.body.codigo); res.json({ status: 'success', data: user }); };
    legacyData = async (req: Request, res: Response) => { res.json({ status: 'success', data: await vincularDatosAnteriores(req.params.empresaId, req.method === 'POST') }); };

    create = async (req: Request, res: Response) => {
        const usuario = await usuariosService.create(req.body);
        res.status(201).json({ status: 'success', data: usuario });
    };

    login = async (req: Request, res: Response) => {
        const usuario = await usuariosService.login(req.body.email, req.body.password);
        res.status(200).json({ status: 'success', data: usuario });
    };

    getPerfiles = async (req: Request, res: Response) => {
        res.status(200).json({ status: 'success', data: { perfiles: await permisosPorPerfil(), definiciones: await definicionesPerfiles(), disponibles: PERMISOS_DISPONIBLES } });
    };

    updatePerfil = async (req: Request, res: Response) => {
        const perfil = await actualizarPermisosPerfil(req.params.perfil, req.body.permisos, (req as any).user.email, req.body.nombre);
        res.status(200).json({ status: 'success', data: perfil });
    };

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
        if (email.toLowerCase() !== (req as any).user.email.toLowerCase()) {
            return res.status(403).json({ message: 'Operación no permitida' });
        }
        const usuario = await usuariosService.getByEmail(email);
        
        if (!usuario) {
            return res.status(200).json({
                status: 'success',
                data: { perfil: null, permisos: [] },
            });
        }
        
        const permissions = await permisosPorPerfil(usuario.empresaId);
        const definitions = await definicionesPerfiles(usuario.empresaId);
        const empresa = usuario.empresaId ? await EmpresaOperadora.findById(usuario.empresaId).select('nombre activo') : null;
        res.status(200).json({
            status: 'success',
            data: {
                perfil: (req as any).user.role || null,
                perfiles: perfilesAsignados(usuario).filter(perfil => permissions[perfil]),
                empresaId: usuario.empresaId,
                empresaNombre: empresa?.nombre,
                estado: usuario.estado,
                perfilLabels: Object.fromEntries(definitions.map(profile => [profile.perfil, profile.nombre])),
                permisos: (req as any).user.permisos,
                permisosPorPerfil: Object.fromEntries(perfilesAsignados(usuario).map(perfil => [perfil, permissions[perfil]])),
                activo: usuario.activo && usuario.estado !== "pendiente" && usuario.estado !== "rechazado" && (!usuario.empresaId || empresa?.activo === true),
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

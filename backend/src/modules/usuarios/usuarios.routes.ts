import { Router } from 'express';
import { UsuariosController } from './usuarios.controller';
import { asyncHandler } from '../../shared/asyncHandler';

const router = Router();
const usuariosController = new UsuariosController();

// Rutas públicas (para NextAuth)
router.get('/permisos/:email', asyncHandler(usuariosController.getPermisosByEmail));
router.post('/sync', asyncHandler(usuariosController.sync));

// Rutas protegidas (solo para operador_seguridad)
router.get('/', asyncHandler(usuariosController.getAll));
router.get('/:id', asyncHandler(usuariosController.getOne));
router.post('/asignar-perfil', asyncHandler(usuariosController.asignarPerfil));
router.patch('/:id', asyncHandler(usuariosController.update));
router.delete('/:id', asyncHandler(usuariosController.delete));

export const usuariosRoutes = router;

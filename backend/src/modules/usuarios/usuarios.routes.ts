import { Router } from 'express';
import { UsuariosController } from './usuarios.controller';
import { asyncHandler } from '../../shared/asyncHandler';

import { authMiddleware, syncAuthMiddleware, requirePermission, requireSecurityProfile, loginAuthMiddleware } from '../../shared/middleware/authMiddleware';

import { CreateUsuarioSchema, LoginUsuarioSchema } from './usuarios.dto';
import { validateBody } from '../../shared/middleware/validationMiddleware';

const router = Router();
const usuariosController = new UsuariosController();

// Rutas públicas (para NextAuth)
router.get('/permisos/:email', authMiddleware, asyncHandler(usuariosController.getPermisosByEmail));
router.post('/login', loginAuthMiddleware, validateBody(LoginUsuarioSchema), asyncHandler(usuariosController.login));
router.post('/mi-solicitud', authMiddleware, asyncHandler(usuariosController.solicitarEmpresa));
router.post('/sync', syncAuthMiddleware, asyncHandler(usuariosController.sync));

router.use(authMiddleware, requirePermission('configuracion'), requireSecurityProfile);

// Rutas protegidas (solo para operador_seguridad)
router.post('/', validateBody(CreateUsuarioSchema), asyncHandler(usuariosController.create));
router.get('/', asyncHandler(usuariosController.getAll));
router.get('/empresas-operadoras', asyncHandler(usuariosController.getEmpresas));
router.post('/empresas-operadoras', asyncHandler(usuariosController.createEmpresa));
router.get('/empresas-operadoras/:empresaId/datos-anteriores', asyncHandler(usuariosController.legacyData));
router.post('/empresas-operadoras/:empresaId/datos-anteriores', asyncHandler(usuariosController.legacyData));
router.post('/perfiles', asyncHandler(usuariosController.createPerfil));
router.delete('/perfiles/:perfil', asyncHandler(usuariosController.deletePerfil));
router.get('/perfiles', requireSecurityProfile, asyncHandler(usuariosController.getPerfiles));
router.patch('/perfiles/:perfil', requireSecurityProfile, asyncHandler(usuariosController.updatePerfil));
router.get('/:id', asyncHandler(usuariosController.getOne));
router.post('/asignar-perfil', asyncHandler(usuariosController.asignarPerfil));
router.patch('/:id', asyncHandler(usuariosController.update));
router.delete('/:id', asyncHandler(usuariosController.delete));

export const usuariosRoutes = router;

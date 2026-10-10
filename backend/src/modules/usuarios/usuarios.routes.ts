import { paginationMiddleware } from '../../shared/pagination';
import { Router } from 'express';
import { UsuariosController } from './usuarios.controller';
import { asyncHandler } from '../../shared/asyncHandler';

import { authMiddleware, syncAuthMiddleware, requirePermission, requireSecurityProfile, loginAuthMiddleware } from '../../shared/middleware/authMiddleware';

import { CreateUsuarioSchema, LoginUsuarioSchema } from './usuarios.dto';
import { validateBody } from '../../shared/middleware/validationMiddleware';
import { empresaPerfilRoutes } from './empresa-perfil.routes';

const router = Router();
const usuariosController = new UsuariosController();
router.use(empresaPerfilRoutes);

// Rutas públicas (para NextAuth)
router.get('/permisos/:email', authMiddleware, asyncHandler(usuariosController.getPermisosByEmail));
router.post('/login', loginAuthMiddleware, validateBody(LoginUsuarioSchema), asyncHandler(usuariosController.login));
router.post('/mi-solicitud', authMiddleware, asyncHandler(usuariosController.solicitarEmpresa));
router.post('/mi-empresa', authMiddleware, asyncHandler(usuariosController.solicitarNuevaEmpresa));
router.post('/sync', syncAuthMiddleware, asyncHandler(usuariosController.sync));

router.use(authMiddleware, requirePermission('configuracion'), requireSecurityProfile);

// Rutas protegidas (solo para operador_seguridad)
router.post('/', validateBody(CreateUsuarioSchema), asyncHandler(usuariosController.create));
router.get('/', paginationMiddleware, asyncHandler(usuariosController.getAll));
router.get('/choferes-empresa', asyncHandler(usuariosController.getChoferesEmpresa));
router.get('/empresas-operadoras', asyncHandler(usuariosController.getEmpresas));
router.post('/empresas-operadoras', asyncHandler(usuariosController.createEmpresa));
router.patch('/empresas-operadoras/:empresaId', asyncHandler(usuariosController.updateEmpresa));
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

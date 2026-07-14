"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.usuariosRoutes = void 0;
const express_1 = require("express");
const usuarios_controller_1 = require("./usuarios.controller");
const asyncHandler_1 = require("../../shared/asyncHandler");
const router = (0, express_1.Router)();
const usuariosController = new usuarios_controller_1.UsuariosController();
// Rutas públicas (para NextAuth)
router.get('/permisos/:email', (0, asyncHandler_1.asyncHandler)(usuariosController.getPermisosByEmail));
router.post('/sync', (0, asyncHandler_1.asyncHandler)(usuariosController.sync));
// Rutas protegidas (solo para operador_seguridad)
router.get('/', (0, asyncHandler_1.asyncHandler)(usuariosController.getAll));
router.get('/:id', (0, asyncHandler_1.asyncHandler)(usuariosController.getOne));
router.post('/asignar-perfil', (0, asyncHandler_1.asyncHandler)(usuariosController.asignarPerfil));
router.patch('/:id', (0, asyncHandler_1.asyncHandler)(usuariosController.update));
router.delete('/:id', (0, asyncHandler_1.asyncHandler)(usuariosController.delete));
exports.usuariosRoutes = router;

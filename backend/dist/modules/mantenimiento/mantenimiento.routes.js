"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mantenimientoRoutes = void 0;
const express_1 = require("express");
const mantenimiento_controller_1 = require("./mantenimiento.controller");
const asyncHandler_1 = require("../../shared/asyncHandler");
const router = (0, express_1.Router)();
const mantenimientoController = new mantenimiento_controller_1.MantenimientoController();
// Search must come before /:id to avoid route collision
router.get('/:vehiculoId/search', (0, asyncHandler_1.asyncHandler)(mantenimientoController.search));
router.get('/:vehiculoId', (0, asyncHandler_1.asyncHandler)(mantenimientoController.getByVehiculo));
router.post('/:vehiculoId', (0, asyncHandler_1.asyncHandler)(mantenimientoController.create));
router.patch('/:id', (0, asyncHandler_1.asyncHandler)(mantenimientoController.update));
router.delete('/:id', (0, asyncHandler_1.asyncHandler)(mantenimientoController.delete));
exports.mantenimientoRoutes = router;

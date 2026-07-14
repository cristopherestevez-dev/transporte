"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.viajesRoutes = void 0;
const express_1 = require("express");
const viajes_controller_1 = require("./viajes.controller");
const asyncHandler_1 = require("../../shared/asyncHandler");
const validationMiddleware_1 = require("../../shared/middleware/validationMiddleware");
const viajes_dto_1 = require("./viajes.dto");
const router = (0, express_1.Router)();
// Rutas para viajes nacionales
router.get('/nacionales', (0, asyncHandler_1.asyncHandler)(viajes_controller_1.viajesNacionalesController.getAll));
router.get('/nacionales/:id', (0, asyncHandler_1.asyncHandler)(viajes_controller_1.viajesNacionalesController.getOne));
router.post('/nacionales', (0, validationMiddleware_1.validateBody)(viajes_dto_1.CreateViajeSchema), (0, asyncHandler_1.asyncHandler)(viajes_controller_1.viajesNacionalesController.create));
router.patch('/nacionales/:id', (0, validationMiddleware_1.validateBody)(viajes_dto_1.UpdateViajeSchema), (0, asyncHandler_1.asyncHandler)(viajes_controller_1.viajesNacionalesController.update));
router.delete('/nacionales/:id', (0, asyncHandler_1.asyncHandler)(viajes_controller_1.viajesNacionalesController.delete));
// Rutas para viajes internacionales
router.get('/internacionales', (0, asyncHandler_1.asyncHandler)(viajes_controller_1.viajesInternacionalesController.getAll));
router.get('/internacionales/:id', (0, asyncHandler_1.asyncHandler)(viajes_controller_1.viajesInternacionalesController.getOne));
router.post('/internacionales', (0, validationMiddleware_1.validateBody)(viajes_dto_1.CreateViajeSchema), (0, asyncHandler_1.asyncHandler)(viajes_controller_1.viajesInternacionalesController.create));
router.patch('/internacionales/:id', (0, validationMiddleware_1.validateBody)(viajes_dto_1.UpdateViajeSchema), (0, asyncHandler_1.asyncHandler)(viajes_controller_1.viajesInternacionalesController.update));
router.delete('/internacionales/:id', (0, asyncHandler_1.asyncHandler)(viajes_controller_1.viajesInternacionalesController.delete));
exports.viajesRoutes = router;

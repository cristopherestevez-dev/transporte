import { paginationMiddleware } from '../../shared/pagination';
import { Router } from 'express';
import { viajesNacionalesController, viajesInternacionalesController } from './viajes.controller';
import { asyncHandler } from '../../shared/asyncHandler';
import { validateBody } from '../../shared/middleware/validationMiddleware';
import { CreateViajeSchema, UpdateViajeSchema } from './viajes.dto';

import { cargaCombustibleSchema } from './viajes.combustible';
import { requirePermission } from '../../shared/middleware/authMiddleware';

const router = Router();

router.get('/operadores', requirePermission('viajes'), asyncHandler(viajesNacionalesController.getOperators));
router.get('/flota', requirePermission('viajes'), asyncHandler(viajesNacionalesController.getFleet));
router.get('/combustible/camiones', requirePermission('viajes'), asyncHandler(viajesNacionalesController.getFuelTrucks));
router.post('/nacionales/:id/combustible', requirePermission('viajes'), validateBody(cargaCombustibleSchema), asyncHandler(viajesNacionalesController.addFuel));
router.post('/internacionales/:id/combustible', requirePermission('viajes'), validateBody(cargaCombustibleSchema), asyncHandler(viajesInternacionalesController.addFuel));

// Rutas para viajes nacionales
router.get('/nacionales', paginationMiddleware, asyncHandler(viajesNacionalesController.getAll));
router.get('/nacionales/:id', asyncHandler(viajesNacionalesController.getOne));
router.post('/nacionales', validateBody(CreateViajeSchema), asyncHandler(viajesNacionalesController.create));
router.patch('/nacionales/:id', validateBody(UpdateViajeSchema), asyncHandler(viajesNacionalesController.update));
router.delete('/nacionales/:id', asyncHandler(viajesNacionalesController.delete));

// Rutas para viajes internacionales
router.get('/internacionales', paginationMiddleware, asyncHandler(viajesInternacionalesController.getAll));
router.get('/internacionales/:id', asyncHandler(viajesInternacionalesController.getOne));
router.post('/internacionales', validateBody(CreateViajeSchema), asyncHandler(viajesInternacionalesController.create));
router.patch('/internacionales/:id', validateBody(UpdateViajeSchema), asyncHandler(viajesInternacionalesController.update));
router.delete('/internacionales/:id', asyncHandler(viajesInternacionalesController.delete));

export const viajesRoutes = router;


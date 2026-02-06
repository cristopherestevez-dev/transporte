import { Router } from 'express';
import { viajesNacionalesController, viajesInternacionalesController } from './viajes.controller';
import { asyncHandler } from '../../shared/asyncHandler';
import { validateBody } from '../../shared/middleware/validationMiddleware';
import { CreateViajeSchema, UpdateViajeSchema } from './viajes.dto';

const router = Router();

// Rutas para viajes nacionales
router.get('/nacionales', asyncHandler(viajesNacionalesController.getAll));
router.get('/nacionales/:id', asyncHandler(viajesNacionalesController.getOne));
router.post('/nacionales', validateBody(CreateViajeSchema), asyncHandler(viajesNacionalesController.create));
router.patch('/nacionales/:id', validateBody(UpdateViajeSchema), asyncHandler(viajesNacionalesController.update));
router.delete('/nacionales/:id', asyncHandler(viajesNacionalesController.delete));

// Rutas para viajes internacionales
router.get('/internacionales', asyncHandler(viajesInternacionalesController.getAll));
router.get('/internacionales/:id', asyncHandler(viajesInternacionalesController.getOne));
router.post('/internacionales', validateBody(CreateViajeSchema), asyncHandler(viajesInternacionalesController.create));
router.patch('/internacionales/:id', validateBody(UpdateViajeSchema), asyncHandler(viajesInternacionalesController.update));
router.delete('/internacionales/:id', asyncHandler(viajesInternacionalesController.delete));

export const viajesRoutes = router;


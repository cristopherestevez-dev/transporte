import { Router } from 'express';
import { viajesNacionalesController, viajesInternacionalesController } from './viajes.controller';
import { asyncHandler } from '../../shared/asyncHandler';

const router = Router();

// Rutas para viajes nacionales
router.get('/nacionales', asyncHandler(viajesNacionalesController.getAll));
router.get('/nacionales/:id', asyncHandler(viajesNacionalesController.getOne));
router.post('/nacionales', asyncHandler(viajesNacionalesController.create));
router.patch('/nacionales/:id', asyncHandler(viajesNacionalesController.update));
router.delete('/nacionales/:id', asyncHandler(viajesNacionalesController.delete));

// Rutas para viajes internacionales
router.get('/internacionales', asyncHandler(viajesInternacionalesController.getAll));
router.get('/internacionales/:id', asyncHandler(viajesInternacionalesController.getOne));
router.post('/internacionales', asyncHandler(viajesInternacionalesController.create));
router.patch('/internacionales/:id', asyncHandler(viajesInternacionalesController.update));
router.delete('/internacionales/:id', asyncHandler(viajesInternacionalesController.delete));

export const viajesRoutes = router;

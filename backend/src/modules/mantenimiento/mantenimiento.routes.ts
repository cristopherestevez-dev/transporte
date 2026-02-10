import { Router } from 'express';
import { MantenimientoController } from './mantenimiento.controller';
import { asyncHandler } from '../../shared/asyncHandler';

const router = Router();
const mantenimientoController = new MantenimientoController();

// Search must come before /:id to avoid route collision
router.get('/:vehiculoId/search', asyncHandler(mantenimientoController.search));
router.get('/:vehiculoId', asyncHandler(mantenimientoController.getByVehiculo));
router.post('/:vehiculoId', asyncHandler(mantenimientoController.create));
router.patch('/:id', asyncHandler(mantenimientoController.update));
router.delete('/:id', asyncHandler(mantenimientoController.delete));

export const mantenimientoRoutes = router;

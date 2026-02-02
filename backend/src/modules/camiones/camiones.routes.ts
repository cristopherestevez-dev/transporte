import { Router } from 'express';
import { CamionesController } from './camiones.controller';
import { asyncHandler } from '../../shared/asyncHandler';

const router = Router();
const camionesController = new CamionesController();

router.get('/', asyncHandler(camionesController.getAll));
router.get('/:id', asyncHandler(camionesController.getOne));
router.post('/', asyncHandler(camionesController.create));
router.patch('/:id', asyncHandler(camionesController.update));
router.delete('/:id', asyncHandler(camionesController.delete));

export const camionesRoutes = router;

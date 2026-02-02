import { Router } from 'express';
import { ChoferesController } from './choferes.controller';
import { asyncHandler } from '../../shared/asyncHandler';

const router = Router();
const choferesController = new ChoferesController();

router.get('/', asyncHandler(choferesController.getAll));
router.get('/:id', asyncHandler(choferesController.getOne));
router.post('/', asyncHandler(choferesController.create));
router.patch('/:id', asyncHandler(choferesController.update));
router.delete('/:id', asyncHandler(choferesController.delete));

export const choferesRoutes = router;

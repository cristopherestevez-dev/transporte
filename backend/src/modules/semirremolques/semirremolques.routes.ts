import { Router } from 'express';
import { SemirremolquesController } from './semirremolques.controller';
import { asyncHandler } from '../../shared/asyncHandler';

const router = Router();
const semirremolquesController = new SemirremolquesController();

router.get('/', asyncHandler(semirremolquesController.getAll));
router.get('/:id', asyncHandler(semirremolquesController.getOne));
router.post('/', asyncHandler(semirremolquesController.create));
router.patch('/:id', asyncHandler(semirremolquesController.update));
router.delete('/:id', asyncHandler(semirremolquesController.delete));

export const semirremolquesRoutes = router;

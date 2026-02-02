import { Router } from 'express';
import { FleterosController } from './fleteros.controller';
import { asyncHandler } from '../../shared/asyncHandler';

const router = Router();
const fleterosController = new FleterosController();

router.get('/', asyncHandler(fleterosController.getAll));
router.get('/:id', asyncHandler(fleterosController.getOne));
router.post('/', asyncHandler(fleterosController.create));
router.patch('/:id', asyncHandler(fleterosController.update));
router.delete('/:id', asyncHandler(fleterosController.delete));

export const fleterosRoutes = router;

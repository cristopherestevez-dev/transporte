import { Router } from 'express';
import { ProveedoresController } from './proveedores.controller';
import { asyncHandler } from '../../shared/asyncHandler';

const router = Router();
const proveedoresController = new ProveedoresController();

router.get('/', asyncHandler(proveedoresController.getAll));
router.get('/:id', asyncHandler(proveedoresController.getOne));
router.post('/', asyncHandler(proveedoresController.create));
router.patch('/:id', asyncHandler(proveedoresController.update));
router.delete('/:id', asyncHandler(proveedoresController.delete));

export const proveedoresRoutes = router;

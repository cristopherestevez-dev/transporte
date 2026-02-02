import { Router } from 'express';
import { UsersController } from './users.controller';
import { asyncHandler } from '../../shared/asyncHandler';

const router = Router();
const usersController = new UsersController();

router.get('/', asyncHandler(usersController.getAll));
router.get('/:id', asyncHandler(usersController.getOne));
router.patch('/:id', asyncHandler(usersController.update));
router.delete('/:id', asyncHandler(usersController.delete));

export const usersRoutes = router;

import { Router } from 'express';
import { AuthController } from './auth.controller';
import { asyncHandler } from '../../shared/asyncHandler';

const router = Router();
const authController = new AuthController();

router.post('/register', asyncHandler(authController.register));
router.post('/login', asyncHandler(authController.login));

export const authRoutes = router;

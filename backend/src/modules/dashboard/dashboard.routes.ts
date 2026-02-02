import { Router } from 'express';
import { DashboardController } from './dashboard.controller';
import { asyncHandler } from '../../shared/asyncHandler';

const router = Router();
const dashboardController = new DashboardController();

router.get('/stats', asyncHandler(dashboardController.getStats));
router.get('/recent-trips', asyncHandler(dashboardController.getRecentTrips));

export const dashboardRoutes = router;

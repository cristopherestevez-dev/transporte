import { Router } from 'express';
import { getNotifications, markAsRead, clearAllNotifications, getNotificationPreferences, updateNotificationPreferences } from './notifications.controller';
import rulesRoutes from './notifications.rules.routes';
// import { authenticate } from '../../shared/middleware/auth.middleware'; // Uncomment when auth is ready

const router = Router();
router.use('/rules', rulesRoutes);

// Add authentication middleware here if needed
// router.use(authenticate);

router.get('/', getNotifications);
router.get('/preferences', getNotificationPreferences);
router.put('/preferences', updateNotificationPreferences);
router.put('/:id/read', markAsRead);
router.delete('/', clearAllNotifications);

export default router;

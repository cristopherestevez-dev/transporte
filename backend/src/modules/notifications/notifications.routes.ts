import { Router } from 'express';
import { getNotifications, markAsRead, clearAllNotifications } from './notifications.controller';
// import { authenticate } from '../../shared/middleware/auth.middleware'; // Uncomment when auth is ready

const router = Router();

// Add authentication middleware here if needed
// router.use(authenticate);

router.get('/', getNotifications);
router.put('/:id/read', markAsRead);
router.delete('/', clearAllNotifications);

export default router;

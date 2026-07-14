"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const notifications_controller_1 = require("./notifications.controller");
// import { authenticate } from '../../shared/middleware/auth.middleware'; // Uncomment when auth is ready
const router = (0, express_1.Router)();
// Add authentication middleware here if needed
// router.use(authenticate);
router.get('/', notifications_controller_1.getNotifications);
router.put('/:id/read', notifications_controller_1.markAsRead);
router.delete('/', notifications_controller_1.clearAllNotifications);
exports.default = router;

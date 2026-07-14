"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.clearAllNotifications = exports.markAsRead = exports.getNotifications = void 0;
const notifications_service_1 = require("./notifications.service");
const notificationService = new notifications_service_1.NotificationService();
const getNotifications = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        // Assuming user info is attached to req by auth middleware
        const userId = ((_a = req.user) === null || _a === void 0 ? void 0 : _a.userId) || 'unknown';
        const role = ((_b = req.user) === null || _b === void 0 ? void 0 : _b.role) || 'admin'; // Fallback or strict
        const notifications = yield notificationService.getNotifications(userId, role);
        res.status(200).json(notifications);
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching notifications', error });
    }
});
exports.getNotifications = getNotifications;
const markAsRead = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const updated = yield notificationService.markAsRead(id);
        res.status(200).json(updated);
    }
    catch (error) {
        res.status(500).json({ message: 'Error marking notification as read', error });
    }
});
exports.markAsRead = markAsRead;
const clearAllNotifications = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const userId = ((_a = req.user) === null || _a === void 0 ? void 0 : _a.userId) || 'unknown';
        const role = (_b = req.user) === null || _b === void 0 ? void 0 : _b.role;
        yield notificationService.clearAll(userId, role);
        res.status(200).json({ message: 'All notifications cleared' });
    }
    catch (error) {
        res.status(500).json({ message: 'Error clearing notifications', error });
    }
});
exports.clearAllNotifications = clearAllNotifications;

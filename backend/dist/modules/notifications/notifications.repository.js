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
exports.NotificationRepository = void 0;
const notifications_model_1 = require("./notifications.model");
class NotificationRepository {
    create(data) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield notifications_model_1.NotificationModel.create(data);
        });
    }
    findByUserOrRole(userId, role) {
        return __awaiter(this, void 0, void 0, function* () {
            const query = {
                $or: [{ userId }]
            };
            if (role) {
                query.$or.push({ role });
            }
            return yield notifications_model_1.NotificationModel.find(query).sort({ createdAt: -1 });
        });
    }
    findExisting(type, resourceId) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield notifications_model_1.NotificationModel.findOne({ type, resourceId });
        });
    }
    markAsRead(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield notifications_model_1.NotificationModel.findByIdAndUpdate(id, { isRead: true }, { new: true });
        });
    }
    deleteForAll(userId, role) {
        return __awaiter(this, void 0, void 0, function* () {
            const query = {
                $or: [{ userId }]
            };
            if (role) {
                query.$or.push({ role });
            }
            yield notifications_model_1.NotificationModel.deleteMany(query);
        });
    }
    deleteInactive(types, activeResourceIds) {
        return __awaiter(this, void 0, void 0, function* () {
            yield notifications_model_1.NotificationModel.deleteMany({
                type: { $in: types },
                resourceId: { $nin: activeResourceIds }
            });
        });
    }
}
exports.NotificationRepository = NotificationRepository;

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
exports.UsersController = void 0;
const users_service_1 = require("./users.service");
const usersService = new users_service_1.UsersService();
class UsersController {
    getAll(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            const users = yield usersService.getAllUsers();
            res.status(200).json({
                status: 'success',
                data: { users },
            });
        });
    }
    getOne(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield usersService.getUserById(req.params.id);
            res.status(200).json({
                status: 'success',
                data: { user },
            });
        });
    }
    update(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield usersService.updateUser(req.params.id, req.body);
            res.status(200).json({
                status: 'success',
                data: { user },
            });
        });
    }
    delete(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            yield usersService.deleteUser(req.params.id);
            res.status(204).json({
                status: 'success',
                data: null,
            });
        });
    }
}
exports.UsersController = UsersController;

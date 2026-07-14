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
exports.UsersService = void 0;
const users_repository_1 = require("./users.repository");
const AppError_1 = require("../../shared/errors/AppError");
class UsersService {
    constructor() {
        this.usersRepository = new users_repository_1.UsersRepository();
    }
    getAllUsers() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.usersRepository.findAll();
        });
    }
    getUserById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield this.usersRepository.findById(id);
            if (!user) {
                throw new AppError_1.AppError('User not found', 404);
            }
            return user;
        });
    }
    updateUser(id, data) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield this.usersRepository.update(id, data);
            if (!user) {
                throw new AppError_1.AppError('User not found', 404);
            }
            return user;
        });
    }
    deleteUser(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield this.usersRepository.delete(id);
            if (!user) {
                throw new AppError_1.AppError('User not found', 404);
            }
            return user;
        });
    }
    countUsers() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.usersRepository.count();
        });
    }
}
exports.UsersService = UsersService;

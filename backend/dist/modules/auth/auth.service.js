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
exports.AuthService = void 0;
const auth_repository_1 = require("./auth.repository");
const AppError_1 = require("../../shared/errors/AppError");
// Note: In a real app, use bcrypt related logic here. Assuming basic setup for now.
class AuthService {
    constructor() {
        this.authRepository = new auth_repository_1.AuthRepository();
    }
    register(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const existingUser = yield this.authRepository.findUserByEmail(data.email);
            if (existingUser) {
                throw new AppError_1.AppError('Email already in use', 400);
            }
            // TODO: Hash password here
            const user = yield this.authRepository.createUser(data);
            return user;
        });
    }
    login(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield this.authRepository.findUserByEmail(data.email);
            // TODO: Compare password here
            if (!user || user.password !== data.password) {
                throw new AppError_1.AppError('Invalid credentials', 401);
            }
            // TODO: Generate JWT here
            return { user, token: 'dummy-token' };
        });
    }
}
exports.AuthService = AuthService;

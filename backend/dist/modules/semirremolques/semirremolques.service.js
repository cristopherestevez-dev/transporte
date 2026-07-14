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
exports.SemirremolquesService = void 0;
const semirremolques_repository_1 = require("./semirremolques.repository");
const AppError_1 = require("../../shared/errors/AppError");
const semirremolquesRepository = new semirremolques_repository_1.SemirremolquesRepository();
class SemirremolquesService {
    getAll() {
        return __awaiter(this, void 0, void 0, function* () {
            return semirremolquesRepository.findAll();
        });
    }
    getById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const semirremolque = yield semirremolquesRepository.findById(id);
            if (!semirremolque) {
                throw new AppError_1.AppError('Semirremolque no encontrado', 404);
            }
            return semirremolque;
        });
    }
    create(data) {
        return __awaiter(this, void 0, void 0, function* () {
            return semirremolquesRepository.create(data);
        });
    }
    update(id, data) {
        return __awaiter(this, void 0, void 0, function* () {
            const semirremolque = yield semirremolquesRepository.update(id, data);
            if (!semirremolque) {
                throw new AppError_1.AppError('Semirremolque no encontrado', 404);
            }
            return semirremolque;
        });
    }
    delete(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const semirremolque = yield semirremolquesRepository.delete(id);
            if (!semirremolque) {
                throw new AppError_1.AppError('Semirremolque no encontrado', 404);
            }
        });
    }
    count() {
        return __awaiter(this, void 0, void 0, function* () {
            return semirremolquesRepository.count();
        });
    }
}
exports.SemirremolquesService = SemirremolquesService;

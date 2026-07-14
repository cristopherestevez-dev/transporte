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
exports.ChoferesService = void 0;
const choferes_repository_1 = require("./choferes.repository");
const AppError_1 = require("../../shared/errors/AppError");
const choferesRepository = new choferes_repository_1.ChoferesRepository();
class ChoferesService {
    getAll() {
        return __awaiter(this, void 0, void 0, function* () {
            return choferesRepository.findAll();
        });
    }
    getById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const chofer = yield choferesRepository.findById(id);
            if (!chofer) {
                throw new AppError_1.AppError('Chofer no encontrado', 404);
            }
            return chofer;
        });
    }
    create(data) {
        return __awaiter(this, void 0, void 0, function* () {
            return choferesRepository.create(data);
        });
    }
    update(id, data) {
        return __awaiter(this, void 0, void 0, function* () {
            const chofer = yield choferesRepository.update(id, data);
            if (!chofer) {
                throw new AppError_1.AppError('Chofer no encontrado', 404);
            }
            return chofer;
        });
    }
    delete(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const chofer = yield choferesRepository.delete(id);
            if (!chofer) {
                throw new AppError_1.AppError('Chofer no encontrado', 404);
            }
        });
    }
    count() {
        return __awaiter(this, void 0, void 0, function* () {
            return choferesRepository.count();
        });
    }
}
exports.ChoferesService = ChoferesService;

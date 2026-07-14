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
exports.FleterosService = void 0;
const fleteros_repository_1 = require("./fleteros.repository");
const AppError_1 = require("../../shared/errors/AppError");
const fleterosRepository = new fleteros_repository_1.FleterosRepository();
class FleterosService {
    getAll() {
        return __awaiter(this, void 0, void 0, function* () {
            return fleterosRepository.findAll();
        });
    }
    getById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const fletero = yield fleterosRepository.findById(id);
            if (!fletero) {
                throw new AppError_1.AppError('Fletero no encontrado', 404);
            }
            return fletero;
        });
    }
    create(data) {
        return __awaiter(this, void 0, void 0, function* () {
            return fleterosRepository.create(data);
        });
    }
    update(id, data) {
        return __awaiter(this, void 0, void 0, function* () {
            const fletero = yield fleterosRepository.update(id, data);
            if (!fletero) {
                throw new AppError_1.AppError('Fletero no encontrado', 404);
            }
            return fletero;
        });
    }
    delete(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const fletero = yield fleterosRepository.delete(id);
            if (!fletero) {
                throw new AppError_1.AppError('Fletero no encontrado', 404);
            }
        });
    }
    count() {
        return __awaiter(this, void 0, void 0, function* () {
            return fleterosRepository.count();
        });
    }
}
exports.FleterosService = FleterosService;

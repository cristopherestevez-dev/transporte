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
exports.CamionesService = void 0;
const camiones_repository_1 = require("./camiones.repository");
const AppError_1 = require("../../shared/errors/AppError");
const camionesRepository = new camiones_repository_1.CamionesRepository();
class CamionesService {
    getAll() {
        return __awaiter(this, void 0, void 0, function* () {
            return camionesRepository.findAll();
        });
    }
    getById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const camion = yield camionesRepository.findById(id);
            if (!camion) {
                throw new AppError_1.AppError('Camión no encontrado', 404);
            }
            return camion;
        });
    }
    create(data) {
        return __awaiter(this, void 0, void 0, function* () {
            return camionesRepository.create(data);
        });
    }
    update(id, data) {
        return __awaiter(this, void 0, void 0, function* () {
            const camion = yield camionesRepository.update(id, data);
            if (!camion) {
                throw new AppError_1.AppError('Camión no encontrado', 404);
            }
            return camion;
        });
    }
    delete(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const camion = yield camionesRepository.delete(id);
            if (!camion) {
                throw new AppError_1.AppError('Camión no encontrado', 404);
            }
        });
    }
    count() {
        return __awaiter(this, void 0, void 0, function* () {
            return camionesRepository.count();
        });
    }
}
exports.CamionesService = CamionesService;

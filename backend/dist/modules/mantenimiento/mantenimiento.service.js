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
exports.MantenimientoService = void 0;
const mantenimiento_repository_1 = require("./mantenimiento.repository");
const AppError_1 = require("../../shared/errors/AppError");
const mantenimientoRepository = new mantenimiento_repository_1.MantenimientoRepository();
class MantenimientoService {
    getByVehiculo(vehiculoId) {
        return __awaiter(this, void 0, void 0, function* () {
            return mantenimientoRepository.findByVehiculo(vehiculoId);
        });
    }
    getById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const registro = yield mantenimientoRepository.findById(id);
            if (!registro) {
                throw new AppError_1.AppError('Registro de mantenimiento no encontrado', 404);
            }
            return registro;
        });
    }
    create(data) {
        return __awaiter(this, void 0, void 0, function* () {
            return mantenimientoRepository.create(data);
        });
    }
    update(id, data) {
        return __awaiter(this, void 0, void 0, function* () {
            const registro = yield mantenimientoRepository.update(id, data);
            if (!registro) {
                throw new AppError_1.AppError('Registro de mantenimiento no encontrado', 404);
            }
            return registro;
        });
    }
    delete(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const registro = yield mantenimientoRepository.delete(id);
            if (!registro) {
                throw new AppError_1.AppError('Registro de mantenimiento no encontrado', 404);
            }
        });
    }
    search(vehiculoId, filters) {
        return __awaiter(this, void 0, void 0, function* () {
            return mantenimientoRepository.search(vehiculoId, filters);
        });
    }
}
exports.MantenimientoService = MantenimientoService;

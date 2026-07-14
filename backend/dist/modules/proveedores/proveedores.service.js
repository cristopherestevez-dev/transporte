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
exports.ProveedoresService = void 0;
const proveedores_repository_1 = require("./proveedores.repository");
const AppError_1 = require("../../shared/errors/AppError");
const proveedoresRepository = new proveedores_repository_1.ProveedoresRepository();
class ProveedoresService {
    getAll() {
        return __awaiter(this, void 0, void 0, function* () {
            return proveedoresRepository.findAll();
        });
    }
    getById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const proveedor = yield proveedoresRepository.findById(id);
            if (!proveedor) {
                throw new AppError_1.AppError('Proveedor no encontrado', 404);
            }
            return proveedor;
        });
    }
    create(data) {
        return __awaiter(this, void 0, void 0, function* () {
            return proveedoresRepository.create(data);
        });
    }
    update(id, data) {
        return __awaiter(this, void 0, void 0, function* () {
            const proveedor = yield proveedoresRepository.update(id, data);
            if (!proveedor) {
                throw new AppError_1.AppError('Proveedor no encontrado', 404);
            }
            return proveedor;
        });
    }
    delete(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const proveedor = yield proveedoresRepository.delete(id);
            if (!proveedor) {
                throw new AppError_1.AppError('Proveedor no encontrado', 404);
            }
        });
    }
    count() {
        return __awaiter(this, void 0, void 0, function* () {
            return proveedoresRepository.count();
        });
    }
}
exports.ProveedoresService = ProveedoresService;

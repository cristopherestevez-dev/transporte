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
exports.viajesInternacionalesService = exports.viajesNacionalesService = exports.ViajesService = void 0;
const viajes_repository_1 = require("./viajes.repository");
const AppError_1 = require("../../shared/errors/AppError");
class ViajesService {
    constructor(tipo) {
        this.tipo = tipo;
        this.repository = tipo === 'nacional' ? viajes_repository_1.viajesNacionalesRepository : viajes_repository_1.viajesInternacionalesRepository;
    }
    getAll() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.repository.findAll();
        });
    }
    getById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const viaje = yield this.repository.findById(id);
            if (!viaje) {
                throw new AppError_1.AppError(`Viaje ${this.tipo} no encontrado`, 404);
            }
            return viaje;
        });
    }
    create(data) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.repository.create(data);
        });
    }
    update(id, data) {
        return __awaiter(this, void 0, void 0, function* () {
            const viaje = yield this.repository.update(id, data);
            if (!viaje) {
                throw new AppError_1.AppError(`Viaje ${this.tipo} no encontrado`, 404);
            }
            return viaje;
        });
    }
    delete(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const viaje = yield this.repository.delete(id);
            if (!viaje) {
                throw new AppError_1.AppError(`Viaje ${this.tipo} no encontrado`, 404);
            }
        });
    }
    count() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.repository.count();
        });
    }
}
exports.ViajesService = ViajesService;
exports.viajesNacionalesService = new ViajesService('nacional');
exports.viajesInternacionalesService = new ViajesService('internacional');

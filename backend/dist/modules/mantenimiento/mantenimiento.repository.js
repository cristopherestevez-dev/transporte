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
exports.MantenimientoRepository = void 0;
const mantenimiento_model_1 = require("./mantenimiento.model");
class MantenimientoRepository {
    findByVehiculo(vehiculoId) {
        return __awaiter(this, void 0, void 0, function* () {
            return mantenimiento_model_1.MantenimientoModel.find({ vehiculoId }).sort({ fecha: -1, km: -1 });
        });
    }
    findById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return mantenimiento_model_1.MantenimientoModel.findById(id);
        });
    }
    create(data) {
        return __awaiter(this, void 0, void 0, function* () {
            return mantenimiento_model_1.MantenimientoModel.create(data);
        });
    }
    update(id, data) {
        return __awaiter(this, void 0, void 0, function* () {
            return mantenimiento_model_1.MantenimientoModel.findByIdAndUpdate(id, data, { new: true, runValidators: true });
        });
    }
    delete(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return mantenimiento_model_1.MantenimientoModel.findByIdAndDelete(id);
        });
    }
    search(vehiculoId, filters) {
        return __awaiter(this, void 0, void 0, function* () {
            const query = { vehiculoId };
            if (filters.fecha) {
                query.fecha = filters.fecha;
            }
            if (filters.kmMin !== undefined || filters.kmMax !== undefined) {
                query.km = {};
                if (filters.kmMin !== undefined) {
                    query.km.$gte = filters.kmMin;
                }
                if (filters.kmMax !== undefined) {
                    query.km.$lte = filters.kmMax;
                }
            }
            return mantenimiento_model_1.MantenimientoModel.find(query).sort({ fecha: -1, km: -1 });
        });
    }
}
exports.MantenimientoRepository = MantenimientoRepository;

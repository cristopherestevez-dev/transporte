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
exports.viajesInternacionalesController = exports.viajesNacionalesController = exports.ViajesController = void 0;
const viajes_service_1 = require("./viajes.service");
class ViajesController {
    constructor(tipo) {
        this.getAll = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            const viajes = yield this.service.getAll();
            res.status(200).json({
                status: 'success',
                results: viajes.length,
                data: viajes,
            });
        });
        this.getOne = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            const viaje = yield this.service.getById(req.params.id);
            res.status(200).json({
                status: 'success',
                data: viaje,
            });
        });
        this.create = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            const viaje = yield this.service.create(req.body);
            res.status(201).json({
                status: 'success',
                data: viaje,
            });
        });
        this.update = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            const viaje = yield this.service.update(req.params.id, req.body);
            res.status(200).json({
                status: 'success',
                data: viaje,
            });
        });
        this.delete = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            yield this.service.delete(req.params.id);
            res.status(204).json({
                status: 'success',
                data: null,
            });
        });
        this.service = tipo === 'nacional' ? viajes_service_1.viajesNacionalesService : viajes_service_1.viajesInternacionalesService;
    }
}
exports.ViajesController = ViajesController;
exports.viajesNacionalesController = new ViajesController('nacional');
exports.viajesInternacionalesController = new ViajesController('internacional');

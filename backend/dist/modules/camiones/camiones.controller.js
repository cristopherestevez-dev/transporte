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
exports.CamionesController = void 0;
const camiones_service_1 = require("./camiones.service");
const camionesService = new camiones_service_1.CamionesService();
class CamionesController {
    constructor() {
        this.getAll = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            const camiones = yield camionesService.getAll();
            res.status(200).json({
                status: 'success',
                results: camiones.length,
                data: camiones,
            });
        });
        this.getOne = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            const camion = yield camionesService.getById(req.params.id);
            res.status(200).json({
                status: 'success',
                data: camion,
            });
        });
        this.create = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            const camion = yield camionesService.create(req.body);
            res.status(201).json({
                status: 'success',
                data: camion,
            });
        });
        this.update = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            const camion = yield camionesService.update(req.params.id, req.body);
            res.status(200).json({
                status: 'success',
                data: camion,
            });
        });
        this.delete = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            yield camionesService.delete(req.params.id);
            res.status(204).json({
                status: 'success',
                data: null,
            });
        });
    }
}
exports.CamionesController = CamionesController;

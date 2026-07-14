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
exports.pagosInternacionalesController = exports.pagosNacionalesController = exports.cobranzasInternacionalesController = exports.cobranzasNacionalesController = void 0;
const facturacion_service_1 = require("./facturacion.service");
class FacturacionController {
    constructor(service) {
        this.getAll = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            const items = yield this.service.getAll();
            res.status(200).json({
                status: 'success',
                results: items.length,
                data: items,
            });
        });
        this.getOne = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            const item = yield this.service.getById(req.params.id);
            res.status(200).json({
                status: 'success',
                data: item,
            });
        });
        this.create = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            const item = yield this.service.create(req.body);
            res.status(201).json({
                status: 'success',
                data: item,
            });
        });
        this.update = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            const item = yield this.service.update(req.params.id, req.body);
            res.status(200).json({
                status: 'success',
                data: item,
            });
        });
        this.delete = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            yield this.service.delete(req.params.id);
            res.status(204).json({
                status: 'success',
                data: null,
            });
        });
        this.service = service;
    }
}
exports.cobranzasNacionalesController = new FacturacionController(facturacion_service_1.cobranzasNacionalesService);
exports.cobranzasInternacionalesController = new FacturacionController(facturacion_service_1.cobranzasInternacionalesService);
exports.pagosNacionalesController = new FacturacionController(facturacion_service_1.pagosNacionalesService);
exports.pagosInternacionalesController = new FacturacionController(facturacion_service_1.pagosInternacionalesService);

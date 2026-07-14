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
exports.ProveedoresController = void 0;
const proveedores_service_1 = require("./proveedores.service");
const proveedoresService = new proveedores_service_1.ProveedoresService();
class ProveedoresController {
    constructor() {
        this.getAll = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            const proveedores = yield proveedoresService.getAll();
            res.status(200).json({
                status: 'success',
                results: proveedores.length,
                data: proveedores,
            });
        });
        this.getOne = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            const proveedor = yield proveedoresService.getById(req.params.id);
            res.status(200).json({
                status: 'success',
                data: proveedor,
            });
        });
        this.create = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            const proveedor = yield proveedoresService.create(req.body);
            res.status(201).json({
                status: 'success',
                data: proveedor,
            });
        });
        this.update = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            const proveedor = yield proveedoresService.update(req.params.id, req.body);
            res.status(200).json({
                status: 'success',
                data: proveedor,
            });
        });
        this.delete = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            yield proveedoresService.delete(req.params.id);
            res.status(204).json({
                status: 'success',
                data: null,
            });
        });
    }
}
exports.ProveedoresController = ProveedoresController;

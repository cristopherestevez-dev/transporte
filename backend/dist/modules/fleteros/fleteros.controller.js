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
exports.FleterosController = void 0;
const fleteros_service_1 = require("./fleteros.service");
const fleterosService = new fleteros_service_1.FleterosService();
class FleterosController {
    constructor() {
        this.getAll = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            const fleteros = yield fleterosService.getAll();
            res.status(200).json({
                status: 'success',
                results: fleteros.length,
                data: fleteros,
            });
        });
        this.getOne = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            const fletero = yield fleterosService.getById(req.params.id);
            res.status(200).json({
                status: 'success',
                data: fletero,
            });
        });
        this.create = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            const fletero = yield fleterosService.create(req.body);
            res.status(201).json({
                status: 'success',
                data: fletero,
            });
        });
        this.update = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            const fletero = yield fleterosService.update(req.params.id, req.body);
            res.status(200).json({
                status: 'success',
                data: fletero,
            });
        });
        this.delete = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            yield fleterosService.delete(req.params.id);
            res.status(204).json({
                status: 'success',
                data: null,
            });
        });
    }
}
exports.FleterosController = FleterosController;

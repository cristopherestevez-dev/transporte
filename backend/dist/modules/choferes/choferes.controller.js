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
exports.ChoferesController = void 0;
const choferes_service_1 = require("./choferes.service");
const choferesService = new choferes_service_1.ChoferesService();
class ChoferesController {
    constructor() {
        this.getAll = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            const choferes = yield choferesService.getAll();
            res.status(200).json({
                status: 'success',
                results: choferes.length,
                data: choferes,
            });
        });
        this.getOne = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            const chofer = yield choferesService.getById(req.params.id);
            res.status(200).json({
                status: 'success',
                data: chofer,
            });
        });
        this.create = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            const chofer = yield choferesService.create(req.body);
            res.status(201).json({
                status: 'success',
                data: chofer,
            });
        });
        this.update = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            const chofer = yield choferesService.update(req.params.id, req.body);
            res.status(200).json({
                status: 'success',
                data: chofer,
            });
        });
        this.delete = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            yield choferesService.delete(req.params.id);
            res.status(204).json({
                status: 'success',
                data: null,
            });
        });
    }
}
exports.ChoferesController = ChoferesController;

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
exports.SemirremolquesController = void 0;
const semirremolques_service_1 = require("./semirremolques.service");
const semirremolquesService = new semirremolques_service_1.SemirremolquesService();
class SemirremolquesController {
    constructor() {
        this.getAll = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            const semirremolques = yield semirremolquesService.getAll();
            res.status(200).json({
                status: 'success',
                results: semirremolques.length,
                data: semirremolques,
            });
        });
        this.getOne = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            const semirremolque = yield semirremolquesService.getById(req.params.id);
            res.status(200).json({
                status: 'success',
                data: semirremolque,
            });
        });
        this.create = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            const semirremolque = yield semirremolquesService.create(req.body);
            res.status(201).json({
                status: 'success',
                data: semirremolque,
            });
        });
        this.update = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            const semirremolque = yield semirremolquesService.update(req.params.id, req.body);
            res.status(200).json({
                status: 'success',
                data: semirremolque,
            });
        });
        this.delete = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            yield semirremolquesService.delete(req.params.id);
            res.status(204).json({
                status: 'success',
                data: null,
            });
        });
    }
}
exports.SemirremolquesController = SemirremolquesController;

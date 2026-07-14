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
exports.FleterosRepository = void 0;
const fleteros_model_1 = require("./fleteros.model");
class FleterosRepository {
    findAll() {
        return __awaiter(this, void 0, void 0, function* () {
            return fleteros_model_1.FleteroModel.find().sort({ createdAt: -1 });
        });
    }
    findById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return fleteros_model_1.FleteroModel.findById(id);
        });
    }
    create(data) {
        return __awaiter(this, void 0, void 0, function* () {
            return fleteros_model_1.FleteroModel.create(data);
        });
    }
    update(id, data) {
        return __awaiter(this, void 0, void 0, function* () {
            return fleteros_model_1.FleteroModel.findByIdAndUpdate(id, data, { new: true, runValidators: true });
        });
    }
    delete(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return fleteros_model_1.FleteroModel.findByIdAndDelete(id);
        });
    }
    count() {
        return __awaiter(this, void 0, void 0, function* () {
            return fleteros_model_1.FleteroModel.countDocuments();
        });
    }
}
exports.FleterosRepository = FleterosRepository;

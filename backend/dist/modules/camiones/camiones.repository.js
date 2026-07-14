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
exports.CamionesRepository = void 0;
const camiones_model_1 = require("./camiones.model");
class CamionesRepository {
    findAll() {
        return __awaiter(this, void 0, void 0, function* () {
            return camiones_model_1.CamionModel.find().sort({ createdAt: -1 });
        });
    }
    findById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return camiones_model_1.CamionModel.findById(id);
        });
    }
    create(data) {
        return __awaiter(this, void 0, void 0, function* () {
            return camiones_model_1.CamionModel.create(data);
        });
    }
    update(id, data) {
        return __awaiter(this, void 0, void 0, function* () {
            return camiones_model_1.CamionModel.findByIdAndUpdate(id, data, { new: true, runValidators: true });
        });
    }
    delete(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return camiones_model_1.CamionModel.findByIdAndDelete(id);
        });
    }
    count() {
        return __awaiter(this, void 0, void 0, function* () {
            return camiones_model_1.CamionModel.countDocuments();
        });
    }
}
exports.CamionesRepository = CamionesRepository;

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
exports.pagosInternacionalesRepository = exports.pagosNacionalesRepository = exports.cobranzasInternacionalesRepository = exports.cobranzasNacionalesRepository = exports.FacturacionRepository = void 0;
const facturacion_model_1 = require("./facturacion.model");
const modelMap = {
    'cobranzas-nacionales': facturacion_model_1.CobranzaNacionalModel,
    'cobranzas-internacionales': facturacion_model_1.CobranzaInternacionalModel,
    'pagos-nacionales': facturacion_model_1.PagoNacionalModel,
    'pagos-internacionales': facturacion_model_1.PagoInternacionalModel,
};
class FacturacionRepository {
    constructor(tipo) {
        this.model = modelMap[tipo];
    }
    findAll() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.model.find().sort({ fecha: -1 });
        });
    }
    findById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.model.findById(id);
        });
    }
    create(data) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.model.create(data);
        });
    }
    update(id, data) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.model.findByIdAndUpdate(id, data, { new: true, runValidators: true });
        });
    }
    delete(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.model.findByIdAndDelete(id);
        });
    }
    count() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.model.countDocuments();
        });
    }
    sumByEstado(estado) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const result = yield this.model.aggregate([
                { $match: { estado } },
                { $group: { _id: null, total: { $sum: '$monto' } } }
            ]);
            return ((_a = result[0]) === null || _a === void 0 ? void 0 : _a.total) || 0;
        });
    }
}
exports.FacturacionRepository = FacturacionRepository;
exports.cobranzasNacionalesRepository = new FacturacionRepository('cobranzas-nacionales');
exports.cobranzasInternacionalesRepository = new FacturacionRepository('cobranzas-internacionales');
exports.pagosNacionalesRepository = new FacturacionRepository('pagos-nacionales');
exports.pagosInternacionalesRepository = new FacturacionRepository('pagos-internacionales');

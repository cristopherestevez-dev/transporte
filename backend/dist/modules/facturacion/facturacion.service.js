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
exports.pagosInternacionalesService = exports.pagosNacionalesService = exports.cobranzasInternacionalesService = exports.cobranzasNacionalesService = exports.FacturacionService = void 0;
const facturacion_repository_1 = require("./facturacion.repository");
const AppError_1 = require("../../shared/errors/AppError");
const repoMap = {
    'cobranzas-nacionales': facturacion_repository_1.cobranzasNacionalesRepository,
    'cobranzas-internacionales': facturacion_repository_1.cobranzasInternacionalesRepository,
    'pagos-nacionales': facturacion_repository_1.pagosNacionalesRepository,
    'pagos-internacionales': facturacion_repository_1.pagosInternacionalesRepository,
};
class FacturacionService {
    constructor(tipo) {
        this.tipo = tipo;
        this.repository = repoMap[tipo];
    }
    getAll() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.repository.findAll();
        });
    }
    getById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const item = yield this.repository.findById(id);
            if (!item) {
                throw new AppError_1.AppError(`${this.tipo} no encontrado`, 404);
            }
            return item;
        });
    }
    create(data) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.repository.create(data);
        });
    }
    update(id, data) {
        return __awaiter(this, void 0, void 0, function* () {
            const item = yield this.repository.update(id, data);
            if (!item) {
                throw new AppError_1.AppError(`${this.tipo} no encontrado`, 404);
            }
            return item;
        });
    }
    delete(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const item = yield this.repository.delete(id);
            if (!item) {
                throw new AppError_1.AppError(`${this.tipo} no encontrado`, 404);
            }
        });
    }
    count() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.repository.count();
        });
    }
}
exports.FacturacionService = FacturacionService;
exports.cobranzasNacionalesService = new FacturacionService('cobranzas-nacionales');
exports.cobranzasInternacionalesService = new FacturacionService('cobranzas-internacionales');
exports.pagosNacionalesService = new FacturacionService('pagos-nacionales');
exports.pagosInternacionalesService = new FacturacionService('pagos-internacionales');

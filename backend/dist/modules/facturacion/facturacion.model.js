"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.PagoInternacionalModel = exports.PagoNacionalModel = exports.CobranzaInternacionalModel = exports.CobranzaNacionalModel = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const facturacionFields = {
    fecha: { type: String, required: true },
    razon_social: { type: String, required: true },
    cuit: { type: String, required: true },
    tipo_comprobante: { type: String, required: true },
    numero_comprobante: { type: String, required: true },
    estado: { type: String, enum: ['pendiente', 'cobrado', 'pagado', 'vencido'], default: 'pendiente' },
    monto: { type: Number, required: true },
    plazo: { type: Number, default: 30 },
};
// Cobranzas - schemas separados para cada colección
const CobranzaNacionalSchema = new mongoose_1.Schema(facturacionFields, { timestamps: true, collection: 'cobranzasNacionales' });
const CobranzaInternacionalSchema = new mongoose_1.Schema(facturacionFields, { timestamps: true, collection: 'cobranzasInternacionales' });
// Pagos - schemas separados para cada colección
const PagoNacionalSchema = new mongoose_1.Schema(facturacionFields, { timestamps: true, collection: 'pagosNacionales' });
const PagoInternacionalSchema = new mongoose_1.Schema(facturacionFields, { timestamps: true, collection: 'pagosInternacionales' });
// Cobranzas
exports.CobranzaNacionalModel = mongoose_1.default.model('CobranzaNacional', CobranzaNacionalSchema);
exports.CobranzaInternacionalModel = mongoose_1.default.model('CobranzaInternacional', CobranzaInternacionalSchema);
// Pagos
exports.PagoNacionalModel = mongoose_1.default.model('PagoNacional', PagoNacionalSchema);
exports.PagoInternacionalModel = mongoose_1.default.model('PagoInternacional', PagoInternacionalSchema);

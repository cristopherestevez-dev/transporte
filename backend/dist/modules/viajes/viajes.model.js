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
exports.ViajeInternacionalModel = exports.ViajeNacionalModel = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const viajeFields = {
    origen: { type: String, required: true },
    destino: { type: String, required: true },
    fecha_salida: { type: String },
    fecha_llegada: { type: String },
    proveedorId: { type: String },
    proveedor: { type: String },
    asignadoId: { type: String },
    tipoAsignacion: { type: String, enum: ['chofer', 'fletero', 'ninguno', null] },
    carga: { type: String },
    tipoCarga: { type: String, enum: ['contenedor', 'byl'] },
    estado: { type: String, enum: ['pendiente', 'en_transito', 'finalizado', 'cancelado'], default: 'pendiente' },
    tarifaTotalAr: { type: Number },
    tarifaChoferPorcentaje: { type: Number },
    tarifaChoferAr: { type: Number },
    tarifaTotalUsd: { type: Number },
    tarifaChoferUsd: { type: Number },
    tarifaChoferUsdAr: { type: Number },
    estadiaCh: { type: Number },
    estadiaAr: { type: Number },
    totalChofer: { type: Number },
    viaticoChileno: { type: Number },
    peajeCh: { type: Number },
    devolCh: { type: Number },
    restoCh: { type: Number },
    viaticoArgentino: { type: Number },
    peajeAr: { type: Number },
    devolAr: { type: Number },
    restoAr: { type: Number },
    adelantoMonto: { type: Number },
    adelantoMoneda: { type: String },
    adelantoAr: { type: Number },
    pago: { type: Number },
    subtotal: { type: Number },
};
const ViajeNacionalSchema = new mongoose_1.Schema(viajeFields, { timestamps: true, collection: 'viajesNacionales' });
const ViajeInternacionalSchema = new mongoose_1.Schema(viajeFields, { timestamps: true, collection: 'viajesInternacionales' });
exports.ViajeNacionalModel = mongoose_1.default.model('ViajeNacional', ViajeNacionalSchema);
exports.ViajeInternacionalModel = mongoose_1.default.model('ViajeInternacional', ViajeInternacionalSchema);

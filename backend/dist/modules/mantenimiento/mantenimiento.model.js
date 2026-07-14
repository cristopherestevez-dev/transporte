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
exports.MantenimientoModel = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const MantenimientoSchema = new mongoose_1.Schema({
    vehiculoId: { type: mongoose_1.Schema.Types.ObjectId, required: true, index: true },
    fecha: { type: String, required: true },
    km: { type: Number, default: 0 },
    patente: { type: String },
    // Aceite
    aceite_cambio: { type: Boolean, default: false },
    aceite_marca: { type: String },
    aceite_codigo: { type: String },
    aceite_precioxl: { type: Number },
    aceite_litros: { type: Number },
    // Filtros
    filtro_aceite_cambio: { type: Boolean, default: false },
    filtro_aceite_marca: { type: String },
    filtro_aceite_codigo: { type: String },
    filtro_aceite_precio: { type: Number },
    filtro_gasoil_cambio: { type: Boolean, default: false },
    filtro_gasoil_marca: { type: String },
    filtro_gasoil_codigo: { type: String },
    filtro_gasoil_precio: { type: Number },
    trampa_agua_cambio: { type: Boolean, default: false },
    trampa_agua_marca: { type: String },
    trampa_agua_codigo: { type: String },
    trampa_agua_precio: { type: Number },
    filtro_aire_cambio: { type: Boolean, default: false },
    filtro_aire_marca: { type: String },
    filtro_aire_codigo: { type: String },
    filtro_aire_precio: { type: Number },
    secado_aire_cambio: { type: Boolean, default: false },
    secado_aire_marca: { type: String },
    secado_aire_codigo: { type: String },
    secado_aire_precio: { type: Number },
    filtro_habitaculo_cambio: { type: Boolean, default: false },
    filtro_habitaculo_marca: { type: String },
    filtro_habitaculo_codigo: { type: String },
    filtro_habitaculo_precio: { type: Number },
    // Motor
    bomba_agua_cambio: { type: Boolean, default: false },
    bomba_agua_marca: { type: String },
    bomba_agua_codigo: { type: String },
    bomba_agua_precio: { type: Number },
    valvulas_cambio: { type: Boolean, default: false },
    valvulas_marca: { type: String },
    valvulas_regular: { type: Boolean, default: false },
    valvulas_precio: { type: Number },
    toberas_cambio: { type: Boolean, default: false },
    toberas_marca: { type: String },
    toberas_codigo: { type: String },
    toberas_precio: { type: Number },
    // Cubiertas
    cubiertas_cambio: { type: Boolean, default: false },
    cubiertas_marca: { type: String },
    cubiertas_cantidad: { type: Number },
    cubiertas_precio_unit: { type: Number },
    // Extras
    extras_descripcion: { type: String },
    extras_precio: { type: Number },
}, { timestamps: true, collection: 'mantenimientos' });
MantenimientoSchema.index({ fecha: 1 });
MantenimientoSchema.index({ km: 1 });
exports.MantenimientoModel = mongoose_1.default.model('Mantenimiento', MantenimientoSchema);

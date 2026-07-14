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
exports.Usuario = exports.PERMISOS_POR_PERFIL = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const UsuarioSchema = new mongoose_1.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    nombre: {
        type: String,
        required: true,
        trim: true,
    },
    imagen: {
        type: String,
        default: null,
    },
    perfil: {
        type: String,
        enum: ['operador_logistico', 'operador_administrativo', 'operador_seguridad', null],
        default: null,
    },
    permisos: {
        type: [String],
        default: [],
    },
    activo: {
        type: Boolean,
        default: true,
    },
}, {
    timestamps: true,
});
// Definir permisos por perfil
exports.PERMISOS_POR_PERFIL = {
    operador_logistico: ['dashboard', 'camiones', 'viajes', 'choferes', 'cotizador', 'empresas'],
    operador_administrativo: ['dashboard', 'cotizador', 'facturacion', 'empresas'],
    operador_seguridad: ['dashboard', 'configuracion'],
};
exports.Usuario = mongoose_1.default.model('Usuario', UsuarioSchema);

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
exports.DashboardController = void 0;
const proveedores_service_1 = require("../proveedores/proveedores.service");
const fleteros_service_1 = require("../fleteros/fleteros.service");
const camiones_service_1 = require("../camiones/camiones.service");
const semirremolques_service_1 = require("../semirremolques/semirremolques.service");
const choferes_service_1 = require("../choferes/choferes.service");
const viajes_service_1 = require("../viajes/viajes.service");
const usuarios_service_1 = require("../usuarios/usuarios.service");
const proveedoresService = new proveedores_service_1.ProveedoresService();
const fleterosService = new fleteros_service_1.FleterosService();
const camionesService = new camiones_service_1.CamionesService();
const semirremolquesService = new semirremolques_service_1.SemirremolquesService();
const choferesService = new choferes_service_1.ChoferesService();
const usuariosService = new usuarios_service_1.UsuariosService();
class DashboardController {
    constructor() {
        this.getStats = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            const [proveedores, fleteros, camiones, semirremolques, choferes, viajesNacionales, viajesInternacionales, users] = yield Promise.all([
                proveedoresService.count(),
                fleterosService.count(),
                camionesService.count(),
                semirremolquesService.count(),
                choferesService.count(),
                viajes_service_1.viajesNacionalesService.count(),
                viajes_service_1.viajesInternacionalesService.count(),
                usuariosService.count()
            ]);
            res.status(200).json({
                status: 'success',
                data: {
                    proveedores,
                    fleteros,
                    camiones,
                    semirremolques,
                    choferes,
                    viajes: viajesNacionales + viajesInternacionales,
                    viajesNacionales,
                    viajesInternacionales,
                    users
                }
            });
        });
        this.getRecentTrips = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            const [nacionales, internacionales] = yield Promise.all([
                viajes_service_1.viajesNacionalesService.getAll(),
                viajes_service_1.viajesInternacionalesService.getAll()
            ]);
            const allTrips = [
                ...nacionales.map(v => (Object.assign(Object.assign({}, v.toObject()), { type: 'nacional' }))),
                ...internacionales.map(v => (Object.assign(Object.assign({}, v.toObject()), { type: 'internacional' })))
            ]
                .sort((a, b) => new Date(b.fecha_salida || 0).getTime() - new Date(a.fecha_salida || 0).getTime())
                .slice(0, 5);
            res.status(200).json({
                status: 'success',
                data: allTrips
            });
        });
    }
}
exports.DashboardController = DashboardController;

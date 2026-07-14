"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const errorMiddleware_1 = require("./shared/errors/errorMiddleware");
const AppError_1 = require("./shared/errors/AppError");
// Import routes
const proveedores_routes_1 = require("./modules/proveedores/proveedores.routes");
const fleteros_routes_1 = require("./modules/fleteros/fleteros.routes");
const camiones_routes_1 = require("./modules/camiones/camiones.routes");
const semirremolques_routes_1 = require("./modules/semirremolques/semirremolques.routes");
const choferes_routes_1 = require("./modules/choferes/choferes.routes");
const viajes_routes_1 = require("./modules/viajes/viajes.routes");
const facturacion_routes_1 = require("./modules/facturacion/facturacion.routes");
const dashboard_routes_1 = require("./modules/dashboard/dashboard.routes");
const usuarios_routes_1 = require("./modules/usuarios/usuarios.routes");
const mantenimiento_routes_1 = require("./modules/mantenimiento/mantenimiento.routes");
const notifications_routes_1 = __importDefault(require("./modules/notifications/notifications.routes"));
const app = (0, express_1.default)();
// Middlewares
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use((0, morgan_1.default)('dev'));
// Routes
app.use('/api/usuarios', usuarios_routes_1.usuariosRoutes);
app.use('/api/proveedores', proveedores_routes_1.proveedoresRoutes);
app.use('/api/fleteros', fleteros_routes_1.fleterosRoutes);
app.use('/api/camiones', camiones_routes_1.camionesRoutes);
app.use('/api/semirremolques', semirremolques_routes_1.semirremolquesRoutes);
app.use('/api/choferes', choferes_routes_1.choferesRoutes);
app.use('/api/viajes', viajes_routes_1.viajesRoutes);
app.use('/api/facturacion', facturacion_routes_1.facturacionRoutes);
app.use('/api/dashboard', dashboard_routes_1.dashboardRoutes);
app.use('/api/mantenimiento', mantenimiento_routes_1.mantenimientoRoutes);
app.use('/api/notifications', notifications_routes_1.default);
app.get('/', (req, res) => {
    res.send('API is running...');
});
// 404 Handler
app.all('*', (req, res, next) => {
    next(new AppError_1.AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});
// Global Error Handler
app.use(errorMiddleware_1.globalErrorHandler);
exports.default = app;

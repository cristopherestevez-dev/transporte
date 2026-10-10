import './shared/tenant';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { globalErrorHandler } from './shared/errors/errorMiddleware';
import { AppError } from './shared/errors/AppError';

// Import routes
import { proveedoresRoutes } from './modules/proveedores/proveedores.routes';
import { fleterosRoutes } from './modules/fleteros/fleteros.routes';
import { camionesRoutes } from './modules/camiones/camiones.routes';
import { semirremolquesRoutes } from './modules/semirremolques/semirremolques.routes';
import { choferesRoutes } from './modules/choferes/choferes.routes';
import { viajesRoutes } from './modules/viajes/viajes.routes';
import { facturacionRoutes } from './modules/facturacion/facturacion.routes';
import { dashboardRoutes } from './modules/dashboard/dashboard.routes';
import { usuariosRoutes } from './modules/usuarios/usuarios.routes';
import { miOperacionRoutes } from './modules/usuarios/mi-operacion.routes';
import { mantenimientoRoutes } from './modules/mantenimiento/mantenimiento.routes';
import notificationsRoutes from './modules/notifications/notifications.routes';

import { authMiddleware, requirePermission } from './shared/middleware/authMiddleware';

const app = express();

// Middlewares
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '8mb' }));
app.use(morgan('dev'));

// Routes
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/mi-operacion', miOperacionRoutes);
app.use('/api/proveedores', authMiddleware, (req, res, next) => requirePermission(...(req.method === 'GET' ? ['empresas', 'viajes', 'cotizador', 'facturacion'] : ['empresas']))(req, res, next), proveedoresRoutes);
app.use('/api/fleteros', authMiddleware, (req, res, next) => requirePermission(...(req.method === 'GET' ? ['empresas', 'viajes', 'cotizador'] : ['empresas']))(req, res, next), fleterosRoutes);
app.use('/api/camiones', authMiddleware, (req, res, next) => requirePermission(...(req.method === 'GET' ? ['camiones', 'cotizador', 'choferes'] : ['camiones']))(req, res, next), camionesRoutes);
app.use('/api/semirremolques', authMiddleware, (req, res, next) => requirePermission(...(req.method === 'GET' ? ['camiones', 'cotizador'] : ['camiones']))(req, res, next), semirremolquesRoutes);
app.use('/api/choferes', authMiddleware, (req, res, next) => requirePermission(...(req.method === 'GET' ? ['choferes', 'viajes', 'cotizador'] : ['choferes']))(req, res, next), choferesRoutes);
app.use('/api/viajes', authMiddleware, (req, res, next) => requirePermission(...(req.method === 'GET' ? ['viajes', 'cotizador'] : ['viajes', 'cotizador']))(req, res, next), viajesRoutes);
app.use('/api/facturacion', authMiddleware, (req, res, next) => requirePermission(...(req.method === 'GET' ? ['facturacion'] : ['facturacion']))(req, res, next), facturacionRoutes);
app.use('/api/dashboard', authMiddleware, (req, res, next) => requirePermission(...(req.method === 'GET' ? ['dashboard'] : ['dashboard']))(req, res, next), dashboardRoutes);
app.use('/api/mantenimiento', authMiddleware, (req, res, next) => requirePermission(...(req.method === 'GET' ? ['camiones'] : ['camiones']))(req, res, next), mantenimientoRoutes);
app.use('/api/notifications', authMiddleware, (req, res, next) => requirePermission(...(req.method === 'GET' ? ['dashboard'] : ['dashboard']))(req, res, next), notificationsRoutes);

app.get('/', (req, res) => {
    res.send('API is running...');
});

// 404 Handler
app.all('*', (req, res, next) => {
    next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global Error Handler
app.use(globalErrorHandler);

export default app;

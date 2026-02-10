import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { globalErrorHandler } from './shared/errors/errorMiddleware';
import { AppError } from './shared/errors/AppError';

// Import routes
import { authRoutes } from './modules/auth/auth.routes';
import { usersRoutes } from './modules/users/users.routes';
import { proveedoresRoutes } from './modules/proveedores/proveedores.routes';
import { fleterosRoutes } from './modules/fleteros/fleteros.routes';
import { camionesRoutes } from './modules/camiones/camiones.routes';
import { semirremolquesRoutes } from './modules/semirremolques/semirremolques.routes';
import { choferesRoutes } from './modules/choferes/choferes.routes';
import { viajesRoutes } from './modules/viajes/viajes.routes';
import { facturacionRoutes } from './modules/facturacion/facturacion.routes';
import { dashboardRoutes } from './modules/dashboard/dashboard.routes';
import { usuariosRoutes } from './modules/usuarios/usuarios.routes';
import { mantenimientoRoutes } from './modules/mantenimiento/mantenimiento.routes';

const app = express();

// Middlewares
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/proveedores', proveedoresRoutes);
app.use('/api/fleteros', fleterosRoutes);
app.use('/api/camiones', camionesRoutes);
app.use('/api/semirremolques', semirremolquesRoutes);
app.use('/api/choferes', choferesRoutes);
app.use('/api/viajes', viajesRoutes);
app.use('/api/facturacion', facturacionRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/mantenimiento', mantenimientoRoutes);

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

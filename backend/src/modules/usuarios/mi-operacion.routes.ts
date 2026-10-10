import { Router } from 'express';
import { authMiddleware, requirePermission, AuthRequest } from '../../shared/middleware/authMiddleware';
import { asyncHandler } from '../../shared/asyncHandler';
import { Usuario } from './usuarios.model';
import { ChoferModel } from '../choferes/choferes.model';
import { CamionModel } from '../camiones/camiones.model';
import { ViajeNacionalModel, ViajeInternacionalModel } from '../viajes/viajes.model';
import { MantenimientoModel } from '../mantenimiento/mantenimiento.model';
import { AppError } from '../../shared/errors/AppError';

const router = Router();
router.use(authMiddleware);
async function ownDriver(req: AuthRequest) {
    const user = await Usuario.findById(req.user?.userId);
    if (!user?.choferId) throw new AppError('El administrador debe vincular tu cuenta con tu ficha de chofer', 409);
    const driver = await ChoferModel.findById(user.choferId);
    if (!driver) throw new AppError('Chofer no encontrado en tu empresa', 404);
    return driver;
}
router.get('/viajes', requirePermission('mis-viajes'), asyncHandler(async (req: AuthRequest, res) => {
    const driver = await ownDriver(req);
    const filter = { tipoAsignacion: 'chofer', asignadoId: driver._id.toString() };
    const fields = 'origen destino fecha_salida fecha_llegada carga estado totalChofer pago';
    const [national, international] = await Promise.all([ViajeNacionalModel.find(filter).select(fields), ViajeInternacionalModel.find(filter).select(fields)]);
    res.json({ status: 'success', data: [...national.map(trip => ({ ...trip.toObject(), tipo: 'Nacional' })), ...international.map(trip => ({ ...trip.toObject(), tipo: 'Internacional' }))] });
}));
router.get('/camion', requirePermission('mi-camion'), asyncHandler(async (req: AuthRequest, res) => {
    const driver = await ownDriver(req);
    if (!driver.camionId) return res.json({ status: 'success', data: { camion: null, servicios: [] } });
    const camion = await CamionModel.findById(driver.camionId);
    if (!camion) throw new AppError('Camión no encontrado en tu empresa', 404);
    const servicios = await MantenimientoModel.find({ vehiculoId: camion._id }).sort({ fecha: -1 });
    res.json({ status: 'success', data: { camion, servicios } });
}));
export const miOperacionRoutes = router;

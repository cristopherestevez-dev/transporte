import { Router, Response } from 'express';
import { authMiddleware, requirePermission, AuthRequest } from '../../shared/middleware/authMiddleware';
import { asyncHandler } from '../../shared/asyncHandler';
import { Usuario } from './usuarios.model';
import { ChoferModel } from '../choferes/choferes.model';
import { CamionModel } from '../camiones/camiones.model';
import { ViajeNacionalModel, ViajeInternacionalModel } from '../viajes/viajes.model';
import { MantenimientoModel } from '../mantenimiento/mantenimiento.model';
import { MantenimientoService } from '../mantenimiento/mantenimiento.service';
import { AppError } from '../../shared/errors/AppError';
import { paginationMiddleware, paginateQuery } from '../../shared/pagination';
import { viajesPage } from '../viajes/viajes.page';

const router = Router();
router.use(authMiddleware);
async function ownDriver(req: AuthRequest) {
    const user = await Usuario.findById(req.user?.userId);
    if (!user?.choferId) throw new AppError('El administrador debe vincular tu cuenta con tu ficha de chofer', 409);
    const driver = await ChoferModel.findById(user.choferId);
    if (!driver) throw new AppError('Chofer no encontrado en tu empresa', 404);
    return driver;
}
const mantenimiento = new MantenimientoService();

async function camionAsignado(req: AuthRequest) {
    const driver = await ownDriver(req);
    if (!driver.camionId) return null;
    const camion = await CamionModel.findById(driver.camionId);
    if (!camion) throw new AppError('Camión no encontrado en tu empresa', 404);
    return camion;
}

async function verificarCamion(req: AuthRequest) {
    const camion = await camionAsignado(req);
    if (!camion || camion._id.toString() !== req.params.vehiculoId) {
        throw new AppError('El vehículo no coincide con tu camión asignado', 403);
    }
    return camion;
}

router.get('/viajes', requirePermission('mis-viajes'), paginationMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
    const driver = await ownDriver(req);
    const filter = { tipoAsignacion: 'chofer', asignadoId: driver._id.toString() };
    const fields = 'origen destino fecha_salida fecha_llegada carga estado totalChofer pago viaticoArgentino peajeAr devolAr restoAr viaticoChileno peajeCh devolCh restoCh adelantoAr subtotal';
    const result = await viajesPage(filter, fields);
    res.json({ status: 'success', data: result.items, summary: result.summary });
}));
router.get('/camion', requirePermission('mi-camion'), paginationMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
    const camion = await camionAsignado(req);
    if (!camion) return res.json({ status: 'success', data: { camion: null, servicios: [] } });
    const servicios = await paginateQuery(MantenimientoModel, MantenimientoModel.find({ vehiculoId: camion._id }).sort({ fecha: -1 }));
    res.json({ status: 'success', data: { camion, servicios } });
}));
router.get('/camion/servicios/:vehiculoId', requirePermission('mi-camion'), paginationMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
    const camion = await verificarCamion(req);
    const { fecha, kmMin, kmMax } = req.query;
    const servicios = await mantenimiento.search(camion._id.toString(), {
        fecha: typeof fecha === 'string' ? fecha : undefined,
        kmMin: kmMin === undefined ? undefined : Number(kmMin),
        kmMax: kmMax === undefined ? undefined : Number(kmMax),
    });
    res.json({ status: 'success', data: servicios });
}));

router.post('/camion/servicios/:vehiculoId', requirePermission('mi-camion'), asyncHandler(async (req: AuthRequest, res: Response) => {
    const camion = await verificarCamion(req);
    const servicio = await mantenimiento.create({ ...req.body, vehiculoId: camion._id, patente: camion.patente });
    res.status(201).json({ status: 'success', data: servicio });
}));

export const miOperacionRoutes = router;

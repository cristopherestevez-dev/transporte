import { Router, Response } from 'express';
import mongoose, { Schema } from 'mongoose';
import { asyncHandler } from '../../shared/asyncHandler';
import { authMiddleware, AuthRequest, requirePermission } from '../../shared/middleware/authMiddleware';
import { AppError } from '../../shared/errors/AppError';
import { tenantContext } from '../../shared/tenant';
import { Usuario } from '../usuarios/usuarios.model';
import { ChoferModel } from './choferes.model';
import { ViajeNacionalModel, ViajeInternacionalModel } from '../viajes/viajes.model';

export function mesActual() {
    const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Argentina/Buenos_Aires', year: 'numeric', month: '2-digit',
    }).formatToParts();
    return parts.find(part => part.type === 'year')!.value + '-' + parts.find(part => part.type === 'month')!.value;
}

export function fechasDelMes(mes: string) {
    return { $gte: mes + '-01', $lte: mes + '-31\uffff' };
}

export function viajesDelMes(mes: string) {
    return {
        $or: [
            { mesPlanilla: mes },
            { mesPlanilla: { $in: [null, ''] }, fecha_salida: fechasDelMes(mes) },
        ],
    };
}

const schema = new Schema({
    empresaId: { type: String, required: true },
    choferId: { type: String, required: true },
    chofer: { type: String, required: true },
    mes: { type: String, required: true },
    cerradoPor: { type: String, required: true },
    cerradoEn: { type: Date, required: true },
    operadores: [String],
    viajes: { type: [Schema.Types.Mixed], required: true },
    neto: { type: Number, required: true },
}, { collection: 'planillasChofer' });
schema.index({ empresaId: 1, choferId: 1, mes: 1 }, { unique: true });
export const Planilla = mongoose.model('PlanillaChofer', schema);
const fields = 'numeroOperativo origen destino fecha_salida mesPlanilla carga tipoCarga camionPatente semirremolquePatente estado tarifaTotalAr tarifaChoferPorcentaje tarifaChoferAr tarifaTotalUsd tarifaChoferUsd tarifaChoferUsdAr totalChofer estadiaAr estadiaCh viaticoArgentino peajeAr devolAr restoAr viaticoChileno peajeCh devolCh restoCh adelantoMonto adelantoMoneda adelantoAr subtotal pago operadorLogisticoId';

async function alcance(req: AuthRequest) {
    const { empresaId, userId, role } = req.user ?? {};
    if (!empresaId || !userId) throw new AppError('Empresa operadora requerida', 403);
    if (role === 'chofer') {
        const user = await Usuario.findOne({ _id: userId, empresaId }).select('choferId').lean();
        if (!user?.choferId) throw new AppError('Tu cuenta debe estar vinculada a un chofer', 403);
        return { empresaId, choferId: user.choferId };
    }
    if (role === 'operador_logistico' || role === 'operador_administrativo') return { empresaId };
    throw new AppError('Tu perfil no puede consultar planillas', 403);
}

export const planillasRoutes = Router();
planillasRoutes.use(authMiddleware);

planillasRoutes.get('/', asyncHandler(async (req: AuthRequest, res: Response) => {
    const scope = await alcance(req);
    const choferId = req.query.choferId;
    if (choferId !== undefined && (typeof choferId !== 'string' || !/^[a-f0-9]{24}$/i.test(choferId))) {
        throw new AppError('Chofer inválido', 400);
    }
    const planillas = await Planilla.find({ ...(choferId ? { choferId } : {}), ...scope })
        .select('-viajes -operadores -cerradoPor').sort({ mes: -1, chofer: 1, _id: -1 }).lean();
    res.json({ data: planillas });
}));

async function viajesDelChofer(empresaId: string, userId: string, choferId: string, mes?: string) {
    const filter = { tipoAsignacion: 'chofer', asignadoId: choferId, ...(mes ? viajesDelMes(mes) : {}) };
    return tenantContext.run({ empresaId, userId }, async () => {
        const [national, international] = await Promise.all([
            ViajeNacionalModel.find(filter).select(fields).lean(),
            ViajeInternacionalModel.find(filter).select(fields).lean(),
        ]);
        return [
            ...national.map(trip => ({ ...trip, tipo: 'nacional' })),
            ...international.map(trip => ({ ...trip, tipo: 'internacional' })),
        ];
    });
}

planillasRoutes.get('/choferes', requirePermission('facturacion'), asyncHandler(async (req: AuthRequest, res: Response) => {
    if (req.user?.role !== 'operador_administrativo' || !req.user.empresaId) {
        throw new AppError('Tu perfil no puede consultar esta lista de choferes', 403);
    }
    const choferes = await ChoferModel.find().select('nombre').sort({ nombre: 1, _id: 1 }).lean();
    res.json({ data: choferes });
}));

planillasRoutes.get('/chofer/:choferId/viajes', requirePermission('choferes', 'facturacion'), asyncHandler(async (req: AuthRequest, res: Response) => {
    const { empresaId, userId, role } = req.user ?? {};
    if ((role !== 'operador_logistico' && role !== 'operador_administrativo') || !empresaId || !userId) throw new AppError('Tu perfil no puede consultar esta planilla', 403);
    const { choferId } = req.params;
    if (!/^[a-f0-9]{24}$/i.test(choferId)) throw new AppError('Chofer inválido', 400);
    if (!await ChoferModel.exists({ _id: choferId })) throw new AppError('Chofer no encontrado', 404);
    const viajes = await viajesDelChofer(empresaId, userId, choferId);
    res.json({ data: viajes.map(({ operadorLogisticoId, tipo, ...viaje }) => ({
        ...viaje,
        tipoViaje: tipo,
        soloLectura: role === 'operador_administrativo' || Boolean(operadorLogisticoId && operadorLogisticoId !== userId),
    })) });
}));

planillasRoutes.get('/:id', asyncHandler(async (req: AuthRequest, res: Response) => {
    const scope = await alcance(req);
    if (!/^[a-f0-9]{24}$/i.test(req.params.id)) throw new AppError('Planilla inválida', 400);
    const planilla = await Planilla.findOne({ ...scope, _id: req.params.id }).select('-operadores -cerradoPor').lean();
    if (!planilla) throw new AppError('Planilla no encontrada', 404);
    const [nacionales, internacionales] = await tenantContext.run({ empresaId: scope.empresaId }, async () => {
        const faltantes = planilla.viajes.filter(viaje => !viaje.numeroOperativo && viaje._id);
        return Promise.all([
            ViajeNacionalModel.find({ _id: { $in: faltantes.filter(viaje => viaje.tipo === 'nacional').map(viaje => viaje._id) } }).select('numeroOperativo').lean(),
            ViajeInternacionalModel.find({ _id: { $in: faltantes.filter(viaje => viaje.tipo === 'internacional').map(viaje => viaje._id) } }).select('numeroOperativo').lean(),
        ]);
    });
    const numeros = {
        nacional: new Map(nacionales.map(viaje => [String(viaje._id), viaje.numeroOperativo])),
        internacional: new Map(internacionales.map(viaje => [String(viaje._id), viaje.numeroOperativo])),
    };
    const viajes = planilla.viajes.map(viaje => ({
        ...viaje,
        numeroOperativo: viaje.numeroOperativo ?? numeros[viaje.tipo === 'internacional' ? 'internacional' : 'nacional'].get(String(viaje._id)),
    }));
    res.json({ data: { ...planilla, viajes } });
}));

planillasRoutes.post('/', requirePermission('choferes', 'viajes', 'facturacion'), asyncHandler(async (req: AuthRequest, res: Response) => {
    const { empresaId, userId, role } = req.user ?? {};
    if ((role !== 'operador_logistico' && role !== 'operador_administrativo') || !empresaId || !userId) throw new AppError('Solo logística y administración pueden cerrar planillas', 403);
    const { choferId, mes } = req.body ?? {};
    if (typeof choferId !== 'string' || !/^[a-f0-9]{24}$/i.test(choferId)
        || typeof mes !== 'string' || !/^\d{4}-(0[1-9]|1[0-2])$/.test(mes)) {
        throw new AppError('Seleccioná un chofer y un mes válido', 400);
    }
    const chofer = await ChoferModel.findById(choferId).select('nombre').lean();
    if (!chofer) throw new AppError('Chofer no encontrado', 404);

    await Planilla.init();
    const key = { empresaId, choferId, mes };
    const trips = await viajesDelChofer(empresaId, userId, choferId, mes);
    if (!trips.length) throw new AppError('El chofer no tiene viajes en ese mes', 400);
    if (trips.some(trip => trip.estado !== 'cancelado' && !Number.isFinite(trip.pago))) {
        throw new AppError('Guardá los importes de todos los viajes del mes antes de cerrar la planilla', 409);
    }

    const viajes = trips.sort((a, b) => (b.fecha_salida ?? '').localeCompare(a.fecha_salida ?? '') ||
        b._id.toString().localeCompare(a._id.toString())).map(({ operadorLogisticoId, ...trip }) => trip);
    const neto = viajes.reduce((total, trip) => total + (trip.estado === 'cancelado' ? 0 : Math.round((trip.pago ?? 0) * 100)), 0) / 100;
    try {
        const planilla = await Planilla.create({
            ...key, chofer: chofer.nombre, cerradoPor: userId, cerradoEn: new Date(),
            operadores: [...new Set(trips.flatMap(trip => trip.operadorLogisticoId ? [trip.operadorLogisticoId] : []))],
            viajes, neto,
        });
        res.status(201).json({ data: { _id: planilla._id, mes } });
    } catch (error) {
        if ((error as { code?: number }).code === 11000) throw new AppError('La planilla de ese mes ya está cerrada', 409);
        throw error;
    }
}));

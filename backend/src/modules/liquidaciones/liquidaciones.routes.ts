import { createHash } from 'node:crypto';
import { Request, Response, Router } from 'express';
import { model, Schema, Types } from 'mongoose';
import { z } from 'zod';
import { ChoferModel } from '../choferes/choferes.model';
import { FleteroModel } from '../fleteros/fleteros.model';
import { IViaje, ViajeInternacionalModel, ViajeNacionalModel } from '../viajes/viajes.model';
import { asyncHandler } from '../../shared/asyncHandler';
import { AppError } from '../../shared/errors/AppError';
import { tenantContext } from '../../shared/tenant';
import { monedas, saldosViaje, Saldos } from './liquidaciones.saldos';

const id = z.string().regex(/^[a-f0-9]{24}$/);
const filtrosSchema = z.object({
    desde: z.iso.date(),
    hasta: z.iso.date(),
    tipo: z.enum(['chofer', 'fletero']),
    responsableId: id,
}).refine(value => value.desde <= value.hasta);
const limiteViajes = 500;
const tipoViajeSchema = z.enum(['nacional', 'internacional']);
const seleccionSchema = z.object({
    clave: z.string().regex(/^(nacional|internacional):[a-f0-9]{24}$/),
    revision: z.string().regex(/^[a-f0-9]{64}$/),
});
const confirmarSchema = z.object({
    filtros: filtrosSchema,
    seleccion: z.array(seleccionSchema).min(1).max(limiteViajes)
        .refine(items => new Set(items.map(item => item.clave)).size === items.length),
});
type Filtros = z.infer<typeof filtrosSchema>;

const schema = new Schema({
    empresaId: { type: String, required: true },
    creadoPor: { type: String, required: true },
    filtros: { type: Object, required: true },
    responsable: { type: String, required: true },
    clavesViaje: { type: [String], required: true },
    viajes: { type: [Object], required: true },
    saldos: { type: Object, required: true },
}, { collection: 'liquidaciones', timestamps: true, autoIndex: false });

const Liquidacion = model('LiquidacionAgrupada', schema);
let indice: Promise<string> | undefined;

function asegurarIndice() {
    indice ??= Liquidacion.collection.createIndex(
        { empresaId: 1, clavesViaje: 1 },
        { unique: true, name: 'liquidacion_viaje_unico_por_empresa' },
    ).catch(error => {
        indice = undefined;
        throw error;
    });
    return indice;
}

function identidad() {
    const context = tenantContext.getStore();
    if (!context?.empresaId || !context.userId) throw new AppError('Se requiere una empresa operadora', 403);
    return { empresaId: context.empresaId, creadoPor: context.userId };
}

function revisionViaje(viaje: object) {
    return createHash('sha256').update(JSON.stringify(viaje)).digest('hex');
}

async function consultarViajes(empresaId: string, filtros: Filtros, claves?: string[]) {
    const { desde, hasta, tipo, responsableId } = filtros;
    const responsable = tipo === 'chofer'
        ? await ChoferModel.findOne({ _id: responsableId, empresaId }).select('nombre').lean()
        : await FleteroModel.findOne({ _id: responsableId, empresaId }).select('nombre').lean();
    if (!responsable) throw new AppError('No se encontró el responsable', 404);

    const fuentes = [
        { tipoViaje: 'nacional', modelo: ViajeNacionalModel },
        { tipoViaje: 'internacional', modelo: ViajeInternacionalModel },
    ];
    const lotes = await Promise.all(fuentes.map(async ({ tipoViaje, modelo }) => {
        const ids = claves?.filter(clave => clave.startsWith(tipoViaje + ':'))
            .map(clave => new Types.ObjectId(clave.split(':')[1]));
        if (ids?.length === 0) return [];

        const viajes = await modelo.aggregate<IViaje & { clave: string }>([
            { $match: {
                empresaId, tipoAsignacion: tipo, asignadoId: responsableId, estado: 'finalizado',
                ...(ids ? { _id: { $in: ids } } : {}),
                fecha_salida: { $gte: desde, $lte: hasta + '\uffff' },
            } },
            { $set: { clave: { $concat: [tipoViaje + ':', { $toString: '$_id' }] } } },
            { $lookup: {
                from: Liquidacion.collection.name,
                localField: 'clave',
                foreignField: 'clavesViaje',
                pipeline: [{ $match: { empresaId } }, { $limit: 1 }, { $project: { _id: 1 } }],
                as: 'liquidaciones',
            } },
            { $match: { 'liquidaciones.0': { $exists: false } } },
            { $sort: { fecha_salida: 1, _id: 1 } },
            { $limit: limiteViajes + 1 },
        ]);
        return viajes.map(viaje => ({
            clave: viaje.clave, tipoViaje, origen: viaje.origen, destino: viaje.destino,
            fechaSalida: viaje.fecha_salida?.slice(0, 10), saldos: saldosViaje(viaje),
        }));
    }));
    const viajes = lotes.flat().sort((a, b) => (a.fechaSalida ?? '').localeCompare(b.fechaSalida ?? '') || a.clave.localeCompare(b.clave));
    if (viajes.length > limiteViajes) throw new AppError('Acotá el período a un máximo de 500 viajes', 422);

    return { filtros, responsable: responsable.nombre, viajes };
}

function sumarSaldos(viajes: { saldos: Saldos }[]) {
    const saldos: Saldos = { ARS: 0, CLP: 0, USD: 0 };
    for (const moneda of monedas) {
        for (const viaje of viajes) {
            saldos[moneda] += viaje.saldos[moneda];
            if (!Number.isSafeInteger(saldos[moneda])) throw new AppError('Saldo fuera del rango permitido', 422);
        }
    }
    return saldos;
}

export const liquidacionesRoutes = Router();

liquidacionesRoutes.get('/vista-previa', asyncHandler(async (req: Request, res: Response) => {
    const { empresaId } = identidad();
    const filtros = filtrosSchema.safeParse(req.query);
    if (!filtros.success) throw new AppError('Ingresá un período válido y un responsable', 400);
    await asegurarIndice();
    const datos = await consultarViajes(empresaId, filtros.data);
    res.json({ data: {
        ...datos,
        viajes: datos.viajes.map(viaje => ({ ...viaje, revision: revisionViaje(viaje) })),
    } });
}));

liquidacionesRoutes.post('/', asyncHandler(async (req: Request, res: Response) => {
    const { empresaId, creadoPor } = identidad();
    const entrada = confirmarSchema.safeParse(req.body);
    if (!entrada.success) throw new AppError('Seleccioná entre 1 y 500 viajes distintos de una vista previa válida', 400);

    await asegurarIndice();
    const { filtros, seleccion } = entrada.data;
    const revisiones = new Map(seleccion.map(item => [item.clave, item.revision]));
    const datos = await consultarViajes(empresaId, filtros, [...revisiones.keys()]);
    const conflicto = 'Uno o más viajes seleccionados cambiaron o ya fueron liquidados. Consultá el período de nuevo.';
    if (datos.viajes.length !== seleccion.length || datos.viajes.some(viaje => revisiones.get(viaje.clave) !== revisionViaje(viaje))) {
        throw new AppError(conflicto, 409);
    }
    const saldos = sumarSaldos(datos.viajes);

    try {
        const comprobante = await Liquidacion.create({
            empresaId, creadoPor, ...datos, saldos, clavesViaje: datos.viajes.map(viaje => viaje.clave),
        });
        const { _id, createdAt } = comprobante;
        res.status(201).json({ data: { _id, createdAt, ...datos, saldos } });
    } catch (error) {
        if ((error as { code?: number }).code === 11000) throw new AppError(conflicto, 409);
        throw error;
    }
}));

liquidacionesRoutes.get('/', asyncHandler(async (req: Request, res: Response) => {
    const { empresaId } = identidad();
    const antes = id.optional().safeParse(req.query.antes);
    if (!antes.success) throw new AppError('Cursor inválido', 400);
    const cursor = antes.data ? { _id: { $lt: new Types.ObjectId(antes.data) } } : {};
    const comprobantes = await Liquidacion.find({ empresaId, ...cursor })
        .select('filtros responsable saldos createdAt').sort({ _id: -1 }).limit(21).lean();
    const items = comprobantes.slice(0, 20);
    res.json({ data: { items, siguiente: comprobantes.length > 20 ? items[19]._id : null } });
}));

liquidacionesRoutes.get('/por-viaje/:tipo/:id', asyncHandler(async (req: Request, res: Response) => {
    const { empresaId } = identidad();
    const tipo = tipoViajeSchema.safeParse(req.params.tipo);
    const viajeId = id.safeParse(req.params.id);
    if (!tipo.success || !viajeId.success) throw new AppError('Viaje inválido', 400);
    const comprobante = await Liquidacion.findOne({ empresaId, clavesViaje: tipo.data + ':' + viajeId.data })
        .select('_id').lean();
    res.json({ data: { comprobanteId: comprobante?._id ?? null } });
}));

liquidacionesRoutes.get('/:id', asyncHandler(async (req: Request, res: Response) => {
    const { empresaId } = identidad();
    if (!id.safeParse(req.params.id).success) throw new AppError('Comprobante inválido', 400);
    const comprobante = await Liquidacion.findOne({ empresaId, _id: req.params.id })
        .select('filtros responsable saldos viajes createdAt').lean();
    if (!comprobante) throw new AppError('No se encontró el comprobante', 404);
    res.json({ data: comprobante });
}));
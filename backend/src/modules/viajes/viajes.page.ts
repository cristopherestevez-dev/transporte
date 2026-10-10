import { ViajeNacionalModel, ViajeInternacionalModel } from './viajes.model';
import { tenantContext } from '../../shared/tenant';
import { listContext, listFilter, pageInfo } from '../../shared/pagination';
import { AppError } from '../../shared/errors/AppError';

export async function viajesPage(filter: any = {}, fields?: string) {
    const empresaId = tenantContext.getStore()?.empresaId;
    const context = listContext.getStore();
    if (!empresaId || !context) throw new AppError('Empresa y paginación requeridas', 403);
    const tipo = context.filters.tipo;
    if (tipo && !['nacional', 'internacional'].includes(tipo)) throw new AppError('Tipo de viaje inválido', 400);
    const model = tipo === 'internacional' ? ViajeInternacionalModel : ViajeNacionalModel;
    const projection = fields ? { ...Object.fromEntries(fields.split(' ').map(key => [key, 1])), type: 1 } : null;
    const pipeline: any[] = [{ $match: listFilter(model, filter) }, { $set: { type: tipo === 'internacional' ? 'internacional' : 'nacional' } }];
    if (!tipo) pipeline.push({ $unionWith: { coll: ViajeInternacionalModel.collection.name, pipeline: [{ $match: { $and: [{ empresaId }, listFilter(ViajeInternacionalModel, filter)] } }, { $set: { type: 'internacional' } }] } });
    pipeline.push({ $set: { netoCobrar: { $ifNull: ['$pago', { $cond: [
        { $ne: [{ $ifNull: ['$subtotal', null] }, null] }, { $subtract: ['$subtotal', { $ifNull: ['$adelantoAr', 0] }] },
        { $cond: [{ $and: [{ $ne: [{ $ifNull: ['$totalChofer', null] }, null] }, { $eq: [{ $ifNull: ['$restoCh', 0] }, 0] }] }, { $subtract: [{ $subtract: ['$totalChofer', { $ifNull: ['$restoAr', 0] }] }, { $ifNull: ['$adelantoAr', 0] }] }, null] },
    ] }] } } });
    const itemPipeline: any[] = [{ $sort: { fecha_salida: -1, createdAt: -1, _id: -1, type: 1 } }, { $skip: (context.page - 1) * context.pageSize }, { $limit: context.pageSize }];
    if (projection) itemPipeline.push({ $project: { ...projection, netoCobrar: 1 } });
    pipeline.push({ $facet: { items: itemPipeline, count: [{ $count: 'total' }], summary: [{ $group: { _id: null, totalChofer: { $sum: '$totalChofer' }, viaticoArgentino: { $sum: '$viaticoArgentino' }, peajeAr: { $sum: '$peajeAr' }, viaticoChileno: { $sum: '$viaticoChileno' }, peajeCh: { $sum: '$peajeCh' }, adelantos: { $sum: '$adelantoAr' }, neto: { $sum: '$netoCobrar' }, pendientes: { $sum: { $cond: [{ $eq: ['$netoCobrar', null] }, 1, 0] } } } }] } });
    const [result] = await model.aggregate(pipeline);
    const total = result?.count[0]?.total || 0;
    return { items: result?.items || [], pagination: pageInfo(total), summary: result?.summary[0] || { totalChofer: 0, viaticoArgentino: 0, peajeAr: 0, viaticoChileno: 0, peajeCh: 0, adelantos: 0, neto: 0, pendientes: 0 } };
}

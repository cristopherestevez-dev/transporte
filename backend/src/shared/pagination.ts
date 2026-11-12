import { AsyncLocalStorage } from 'node:async_hooks';
import { Request, Response, NextFunction } from 'express';
import { Model, Query } from 'mongoose';
import { AppError } from './errors/AppError';

export interface PageInfo { page: number; pageSize: number; total: number; totalPages: number; }
interface ListContext { page: number; pageSize: number; search: string; filters: Record<string, string>; pagination?: PageInfo; }
export const listContext = new AsyncLocalStorage<ListContext>();
export const paginationMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const page = req.query.page === undefined ? 1 : Number(req.query.page);
    const pageSize = req.query.pageSize === undefined && req.query.limit === undefined ? 5 : Number(req.query.pageSize ?? req.query.limit);
    if (!Number.isSafeInteger(page) || page < 1 || ![5, 15, 25].includes(pageSize)) return next(new AppError('Paginación inválida: page desde 1 y pageSize 5, 15 o 25', 400));
    if (req.query.search !== undefined && (typeof req.query.search !== 'string' || req.query.search.length > 100)) return next(new AppError('Búsqueda inválida', 400));
    const filters: Record<string, string> = {};
    for (const key of ['direccion_facturacion', 'asignadoId', 'tipoAsignacion', 'proveedorId', 'perfil', 'tipo']) if (typeof req.query[key] === 'string') filters[key] = String(req.query[key]);
    for (const [key, value] of Object.entries(req.query)) {
        if ((key.startsWith('viaje_') || key.startsWith('col_')) && typeof value === 'string' && value.length <= 100 && value.trim()) {
            filters[key] = value.trim();
        }
    }
    const context: ListContext = { page, pageSize, search: String(req.query.search || '').trim(), filters };
    const json = res.json.bind(res);
    res.json = ((payload: any) => json(context.pagination ? { ...payload, pagination: context.pagination } : payload)) as typeof res.json;
    listContext.run(context, () => next());
};
export function pageInfo(total: number): PageInfo {
    const context = listContext.getStore();
    if (!context) throw new AppError('Paginación no configurada', 500);
    return context.pagination = { page: context.page, pageSize: context.pageSize, total, totalPages: Math.ceil(total / context.pageSize) };
}
const textColumns = new Set(['patente', 'marca', 'modelo', 'seguro', 'numero_chasis', 'numero_motor', 'nombre', 'dni', 'telefono', 'cuil_cuit', 'tipo', 'direccion', 'email', 'usuario', 'estado', 'permisos', 'origen', 'destino', 'carga', 'proveedor', 'numero_comprobante']);
const exactColumns = new Set(['vencimiento_seguro', 'licencia', 'fecha_salida', 'fecha_llegada', 'camionId', 'empresaId']);

export function listFilter(model: Model<any>, filter: any = {}) {
    const context = listContext.getStore();
    if (!context) return filter;
    const conditions: any[] = [filter];
    for (const [key, value] of Object.entries(context.filters)) {
        if (key.startsWith('col_')) {
            const field = key.slice(4);
            const path = model.schema.path(field);
            if (!path) continue;
            if (textColumns.has(field)) {
                const escaped = value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                conditions.push({ [field]: { $regex: escaped, $options: 'i' } });
            } else if (exactColumns.has(field)) {
                conditions.push({ [field]: value });
            } else if (field === 'activo' && ['true', 'false'].includes(value)) {
                conditions.push({ activo: value === 'true' });
            } else if (['anio', 'numero_ejes'].includes(field)) {
                const number = Number(value);
                if (Number.isSafeInteger(number)) conditions.push({ [field]: number });
            } else if (field === 'perfiles') {
                conditions.push({ $or: [{ perfiles: value }, { perfil: value }] });
            }
            continue;
        }
        if (key === 'perfil' && model.schema.path('perfiles')) conditions.push({ $or: [{ perfil: value }, { perfiles: value }] });
        else if (key === 'direccion_facturacion' && value === 'emitida' && model.schema.path(key)) conditions.push({ $or: [{ direccion_facturacion: 'emitida' }, { direccion_facturacion: { $exists: false } }, { direccion_facturacion: null }] });
        else if (model.schema.path(key)) conditions.push({ [key]: value });
    }
    if (context.search) {
        const text = context.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const fields = Object.entries(model.schema.paths).filter(([key, path]) => path.instance === 'String' && !['empresaId', 'passwordHash'].includes(key));
        if (fields.length) conditions.push({ $or: fields.map(([key]) => ({ [key]: { $regex: text, $options: 'i' } })) });
    }
    return conditions.length === 1 ? filter : { $and: conditions };
}
export async function paginateQuery<T>(model: Model<any>, query: Query<T[], any>): Promise<T[]> {
    const context = listContext.getStore();
    if (!context) return query;
    const filter = listFilter(model, query.getFilter());
    query.setQuery(filter);
    query.sort({ ...query.getOptions().sort as any, _id: -1 });
    const [rows, total] = await Promise.all([query.skip((context.page - 1) * context.pageSize).limit(context.pageSize), model.countDocuments(filter)]);
    pageInfo(total);
    return rows as T[];
}

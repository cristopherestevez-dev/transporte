import { AsyncLocalStorage } from 'node:async_hooks';
import mongoose, { Schema } from 'mongoose';
import { AppError } from './errors/AppError';

export const tenantContext = new AsyncLocalStorage<{ empresaId?: string; userId?: string; superAdmin?: boolean }>();
const collections = new Set(['proveedores', 'fleteros', 'camiones', 'semirremolques', 'choferes', 'viajesNacionales', 'viajesInternacionales', 'cobranzasNacionales', 'cobranzasInternacionales', 'pagosNacionales', 'pagosInternacionales', 'mantenimientos', 'notifications']);

function empresaActual() {
    const context = tenantContext.getStore();
    if (context && !context.empresaId) throw new AppError('Tu cuenta debe estar vinculada a una empresa operadora', 403);
    return context?.empresaId;
}

export function tenantPlugin(schema: Schema) {
    if (!collections.has(schema.options.collection || '')) return;
    schema.add({ empresaId: { type: String, index: true, immutable: true } });
    schema.pre('validate', function () {
        const empresaId = empresaActual();
        if (empresaId) this.set('empresaId', empresaId);
    });
    schema.pre(['find', 'findOne', 'countDocuments', 'distinct', 'updateOne', 'updateMany', 'findOneAndUpdate', 'deleteOne', 'deleteMany', 'findOneAndDelete'], function () {
        const empresaId = empresaActual();
        if (!empresaId) return;
        this.setQuery({ $and: [this.getFilter(), { empresaId }] });
        const update = this.getUpdate() as any;
        if (update) {
            if (Array.isArray(update)) throw new AppError('Actualización no permitida', 400);
            delete update.empresaId;
            if (update.$set) delete update.$set.empresaId;
            if (update.$unset) delete update.$unset.empresaId;
            if (this.getOptions().upsert) update.$setOnInsert = { ...update.$setOnInsert, empresaId };
            this.setUpdate(update);
        }
    });
    schema.pre('aggregate', function () {
        const empresaId = empresaActual();
        if (empresaId) this.pipeline().unshift({ $match: { empresaId } });
    });
}

mongoose.plugin(tenantPlugin);

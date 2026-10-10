import mongoose from 'mongoose';
import { z } from 'zod';
import { EmpresaOperadora } from './empresas.model';
import { Usuario } from './usuarios.model';
import { tenantContext } from '../../shared/tenant';
import { AppError } from '../../shared/errors/AppError';

const companySchema = z.object({ nombre: z.string().trim().min(1).max(200), codigo: z.string().trim().toLowerCase().regex(/^[a-z0-9][a-z0-9-]{2,49}$/), activo: z.boolean().default(true) });
export async function empresasAdministrables() {
    const empresaId = tenantContext.getStore()?.empresaId;
    return EmpresaOperadora.find(empresaId ? { _id: empresaId } : {}).sort({ nombre: 1 });
}
export async function crearEmpresa(data: unknown, email: string) {
    if (!tenantContext.getStore()?.superAdmin) throw new AppError('Solo la administración general puede crear empresas operadoras', 403);
    const result = companySchema.safeParse(data);
    if (!result.success) throw new AppError('Nombre o código de empresa inválido', 400);
    if (await EmpresaOperadora.exists({ codigo: result.data.codigo })) throw new AppError('El código de empresa ya existe', 409);
    return EmpresaOperadora.create({ ...result.data, creadaPor: email });
}
export async function solicitarEmpresa(userId: string, codigo: unknown) {
    if (typeof codigo !== 'string') throw new AppError('Indicá el código de la empresa', 400);
    const user = await Usuario.findById(userId);
    if (!user || user.empresaId || (user.perfiles || []).includes('operador_seguridad') || user.perfil === 'operador_seguridad') throw new AppError('Esta solicitud ya tiene una empresa asignada', 409);
    const empresa = await EmpresaOperadora.findOne({ codigo: codigo.trim().toLowerCase(), activo: true });
    if (!empresa) throw new AppError('Empresa no encontrada. Pedí el código a su administrador', 404);
    return Usuario.findByIdAndUpdate(userId, { $set: { empresaId: empresa._id.toString(), activo: false, estado: 'pendiente', perfil: null, perfiles: [], permisos: [] } }, { new: true });
}

const legacyCollections = ['proveedores', 'fleteros', 'camiones', 'semirremolques', 'choferes', 'viajesNacionales', 'viajesInternacionales', 'cobranzasNacionales', 'cobranzasInternacionales', 'pagosNacionales', 'pagosInternacionales', 'mantenimientos', 'notifications'];
export async function vincularDatosAnteriores(empresaId: string, execute = false) {
    if (!tenantContext.getStore()?.superAdmin) throw new AppError('Operación reservada a la administración general', 403);
    if (!mongoose.isValidObjectId(empresaId) || !await EmpresaOperadora.exists({ _id: empresaId, activo: true })) throw new AppError('Empresa inválida', 400);
    const results: Record<string, number> = {};
    for (const name of legacyCollections) {
        const collection = mongoose.connection.collection(name);
        const filter = { empresaId: { $exists: false } };
        results[name] = execute ? (await collection.updateMany(filter, { $set: { empresaId } })).modifiedCount : await collection.countDocuments(filter);
    }
    return results;
}

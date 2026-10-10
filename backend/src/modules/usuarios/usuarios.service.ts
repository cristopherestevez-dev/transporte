import { paginateQuery } from '../../shared/pagination';
import { tenantContext } from '../../shared/tenant';
import { EmpresaOperadora } from './empresas.model';
import { ChoferModel } from '../choferes/choferes.model';
import { hashPassword, verifyPassword } from './password';
import { z } from 'zod';
import { CreateUsuarioSchema } from './usuarios.dto';
import { permisosPorPerfil } from './perfiles.service';
import { AppError } from '../../shared/errors/AppError';
import { Usuario, IUsuario, Perfil, perfilesAsignados } from './usuarios.model';

const attempts = new Map<string, { count: number; expires: number }>();

export class UsuariosService {
    private userScope() { const empresaId = tenantContext.getStore()?.empresaId; return empresaId ? { empresaId } : {}; }
    private async checkEmpresa(empresaId?: string) {
        const current = tenantContext.getStore()?.empresaId;
        if (!empresaId || (current && current !== empresaId) || !await EmpresaOperadora.exists({ _id: empresaId, activo: true })) throw new AppError('Empresa operadora inválida', 400);
    }
    async create(data: z.infer<typeof CreateUsuarioSchema>) {
        await this.checkEmpresa(data.empresaId);
        // The reserved .invalid domain keeps legacy email-based session identities
        // unique for accounts that authenticate exclusively with a username.
        const email = data.email || `${data.usuario}@usuarios.invalid`;
        if (await Usuario.findOne({ $or: [{ email }, ...(data.usuario ? [{ usuario: data.usuario }] : [])] })) throw new AppError('El usuario o email ya está registrado', 409);
        const assignments = await this.profileChanges(data.perfiles, data.empresaId);
        await this.checkChofer(data.choferId, data.empresaId);
        if (data.perfiles.includes('chofer') && !data.choferId) throw new AppError('Vinculá el usuario con su ficha de chofer', 400);
        const user = await Usuario.create({ nombre: data.nombre, usuario: data.usuario, email, activo: data.activo, empresaId: data.empresaId, choferId: data.choferId, estado: 'aprobado', ...assignments, passwordHash: await hashPassword(data.password) });
        if (assignments.perfiles.includes('operador_seguridad')) await EmpresaOperadora.updateOne({ _id: data.empresaId, administradorId: { $exists: false } }, { $set: { administradorId: user._id.toString() } });
        return user;
    }

    async login(email: string, password: string) {
        const now = Date.now();
        for (const [key, value] of attempts) if (value.expires <= now) attempts.delete(key);
        const attempt = attempts.get(email) || { count: 0, expires: now + 15 * 60 * 1000 };
        if (attempt.count >= 5) throw new AppError('Demasiados intentos. Intentá nuevamente en unos minutos', 429);
        attempt.count++;
        attempts.set(email, attempt);
        const user = await Usuario.findOne({ $or: [{ email }, { usuario: email }] }).select('+passwordHash');
        const valid = await verifyPassword(password, user?.passwordHash);
        if (!valid || !user?.activo || user.estado === 'pendiente' || user.estado === 'rechazado') throw new AppError('Usuario o contraseña incorrectos', 401);
        attempts.delete(email);
        return { id: user._id.toString(), email: user.email, name: user.nombre, image: user.imagen || null };
    }

    async getAll() {
        const usuarios = await paginateQuery(Usuario, Usuario.find(this.userScope()).sort({ createdAt: -1 }));
        return Promise.all(usuarios.map(async usuario => {
            const permissions = await permisosPorPerfil(usuario.empresaId);
            return { ...usuario.toObject(), perfiles: perfilesAsignados(usuario), permisos: [...new Set(perfilesAsignados(usuario).flatMap(perfil => permissions[perfil] || []))] };
        }));
    }

    async choferesEmpresa(empresaId: string) {
        await this.checkEmpresa(empresaId);
        return tenantContext.run({ ...tenantContext.getStore(), empresaId }, async () => await ChoferModel.find().select('nombre dni camionId'));
    }
    private async checkChofer(choferId: string | undefined, empresaId: string | undefined) {
        if (!choferId) return;
        const exists = await tenantContext.run({ ...tenantContext.getStore(), empresaId }, async () => await ChoferModel.exists({ _id: choferId }));
        if (!exists) throw new AppError('Chofer no encontrado en la empresa', 400);
    }

    async getByEmail(email: string) {
        return Usuario.findOne({ email: email.toLowerCase() });
    }

    async getById(id: string) {
        return Usuario.findOne({ _id: id, ...this.userScope() });
    }

    // Sincronizar usuario desde Google OAuth
    async syncFromGoogle(data: { email: string; nombre: string; imagen?: string }) {
        const email = data.email.toLowerCase();
        
        let usuario = await Usuario.findOne({ email });
        
        if (!usuario) {
            // Crear nuevo usuario sin permisos (pendiente de asignación)
            usuario = await Usuario.create({
                email,
                nombre: data.nombre,
                imagen: data.imagen,
                perfil: null,
                permisos: [],
                activo: false,
                estado: 'pendiente',
                perfiles: [],
            });
        } else {
            if (!usuario.activo && usuario.estado !== 'pendiente') throw new AppError('Usuario inactivo', 403);
            // Actualizar nombre e imagen
            usuario.nombre = data.nombre;
            if (data.imagen) usuario.imagen = data.imagen;
            await usuario.save();
        }
        
        return usuario;
    }

    private async profileChanges(value: unknown, empresaId?: string) {
        if (Array.isArray(value) && value.includes('superadmin')) throw new AppError('Superadmin está reservado al dueño de la plataforma', 403);
        const permissions = await permisosPorPerfil(empresaId);
        if (!Array.isArray(value) || value.length > 30 || value.some(profile => typeof profile !== 'string' || !Object.prototype.hasOwnProperty.call(permissions, profile))) throw new AppError('Perfiles inválidos', 400);
        const perfiles = [...new Set(value)] as Perfil[];
        return {
            perfiles,
            perfil: perfiles[0] || null,
            permisos: [...new Set(perfiles.flatMap(profile => permissions[profile]))],
        };
    }

    async asignarPerfil(email: string, perfil: string) {
        const current = await Usuario.findOne({ email: email.toLowerCase(), ...this.userScope() });
        if (current && perfilesAsignados(current).includes('superadmin')) throw new AppError('La cuenta del dueño se administra por separado', 403);
        return Usuario.findOneAndUpdate(
            { email: email.toLowerCase(), ...this.userScope() },
            await this.profileChanges([perfil]),
            { new: true, runValidators: true }
        );
    }

    async update(id: string, data: Partial<IUsuario>) {
        const current = await this.getById(id);
        if (!current) throw new AppError('Usuario no encontrado', 404);
        if (perfilesAsignados(current).includes('superadmin')) throw new AppError('La cuenta del dueño se administra por separado', 403);
        data = Object.fromEntries(Object.entries(data).filter(([key]) => ['nombre', 'usuario', 'perfiles', 'perfil', 'activo', 'empresaId', 'choferId', 'estado'].includes(key))) as Partial<IUsuario>;
        if (data.usuario !== undefined) {
            data.usuario = data.usuario.trim().toLowerCase();
            if (data.usuario && !/^[a-z0-9][a-z0-9._-]{2,63}$/.test(data.usuario)) throw new AppError('Usuario inválido: usá letras, números, puntos o guiones', 400);
            if (data.usuario && await Usuario.exists({ usuario: data.usuario, _id: { $ne: id } })) throw new AppError('El nombre de usuario ya está registrado', 409);
            if (!data.usuario) delete data.usuario;
        }
        const empresaId = data.empresaId || current.empresaId;
        if (empresaId) await this.checkEmpresa(empresaId);
        if (data.perfiles !== undefined || data.perfil !== undefined) {
            const assigned = data.perfiles !== undefined ? data.perfiles : data.perfil === null ? [] : [data.perfil];
            data = { ...data, ...await this.profileChanges(assigned, empresaId) };
        }
        if (data.estado === 'aprobado' && (!empresaId || !(data.perfiles || perfilesAsignados(current)).length)) throw new AppError('Para aprobar, asigná empresa y perfiles', 400);
        await this.checkChofer(data.choferId, empresaId);
        if ((data.perfiles || perfilesAsignados(current)).includes('chofer') && !(data.choferId === undefined ? current.choferId : data.choferId)) throw new AppError('Vinculá el usuario con su ficha de chofer', 400);
        if (current.empresaId && empresaId !== current.empresaId && !data.choferId) data.choferId = '';
        if (data.estado === 'pendiente' || data.estado === 'rechazado') data.activo = false;
        if (data.estado === 'aprobado' && current.estado === 'pendiente') data.activo = true;
        return Usuario.findOneAndUpdate({ _id: id, ...this.userScope() }, { $set: data }, { new: true, runValidators: true });
    }
    async delete(id: string) {
        const current = await this.getById(id);
        if (!current) throw new AppError('Usuario no encontrado', 404);
        if (perfilesAsignados(current).includes('superadmin')) throw new AppError('No se puede dar de baja al dueño de la plataforma', 403);
        if (id === tenantContext.getStore()?.userId) throw new AppError('No podés dar de baja tu propia cuenta', 400);
        return Usuario.findOneAndUpdate({ _id: id, ...this.userScope() }, { $set: { activo: false, estado: 'rechazado' } }, { new: true });
    }

    async count() {
        return Usuario.countDocuments(this.userScope());
    }
}

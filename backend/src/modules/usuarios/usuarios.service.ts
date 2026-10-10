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
        if (await Usuario.findOne({ email: data.email })) throw new AppError('Ya existe un usuario con ese email', 409);
        const assignments = await this.profileChanges(data.perfiles, data.empresaId);
        return Usuario.create({ nombre: data.nombre, email: data.email, activo: data.activo, empresaId: data.empresaId, choferId: data.choferId, estado: 'aprobado', ...assignments, passwordHash: await hashPassword(data.password) });
    }

    async login(email: string, password: string) {
        const now = Date.now();
        for (const [key, value] of attempts) if (value.expires <= now) attempts.delete(key);
        const attempt = attempts.get(email) || { count: 0, expires: now + 15 * 60 * 1000 };
        if (attempt.count >= 5) throw new AppError('Demasiados intentos. Intentá nuevamente en unos minutos', 429);
        attempt.count++;
        attempts.set(email, attempt);
        const user = await Usuario.findOne({ email }).select('+passwordHash');
        const valid = await verifyPassword(password, user?.passwordHash);
        if (!valid || !user?.activo) throw new AppError('Email o contraseña incorrectos', 401);
        attempts.delete(email);
        return { id: user._id.toString(), email: user.email, name: user.nombre, image: user.imagen || null };
    }

    async getAll() {
        const usuarios = await Usuario.find(this.userScope()).sort({ createdAt: -1 });
        const permissions = await permisosPorPerfil();
        return usuarios.map(usuario => ({ ...usuario.toObject(), perfiles: perfilesAsignados(usuario), permisos: [...new Set(perfilesAsignados(usuario).flatMap(perfil => permissions[perfil] || []))] }));
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
        return Usuario.findOneAndUpdate(
            { email: email.toLowerCase(), ...this.userScope() },
            await this.profileChanges([perfil]),
            { new: true, runValidators: true }
        );
    }

    async update(id: string, data: Partial<IUsuario>) {
        const current = await this.getById(id);
        if (!current) throw new AppError('Usuario no encontrado', 404);
        data = Object.fromEntries(Object.entries(data).filter(([key]) => ['nombre', 'perfiles', 'perfil', 'activo', 'empresaId', 'choferId', 'estado'].includes(key))) as Partial<IUsuario>;
        const empresaId = data.empresaId || current.empresaId;
        if (empresaId) await this.checkEmpresa(empresaId);
        if (data.perfiles !== undefined || data.perfil !== undefined) {
            const assigned = data.perfiles !== undefined ? data.perfiles : data.perfil === null ? [] : [data.perfil];
            data = { ...data, ...await this.profileChanges(assigned, empresaId) };
        }
        if (data.estado === 'aprobado' && (!empresaId || !(data.perfiles || perfilesAsignados(current)).length)) throw new AppError('Para aprobar, asigná empresa y perfiles', 400);
        if (data.choferId && !await ChoferModel.exists({ _id: data.choferId, empresaId })) throw new AppError('Chofer no encontrado en la empresa', 400);
        if (data.estado === 'pendiente' || data.estado === 'rechazado') data.activo = false;
        if (data.estado === 'aprobado' && current.estado === 'pendiente') data.activo = true;
        return Usuario.findOneAndUpdate({ _id: id, ...this.userScope() }, { $set: data }, { new: true, runValidators: true });
    }
    async delete(id: string) {
        if (id === tenantContext.getStore()?.userId) throw new AppError('No podés dar de baja tu propia cuenta', 400);
        return Usuario.findOneAndUpdate({ _id: id, ...this.userScope() }, { $set: { activo: false, estado: 'rechazado' } }, { new: true });
    }

    async count() {
        return Usuario.countDocuments(this.userScope());
    }
}

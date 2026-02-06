import { Usuario, PERMISOS_POR_PERFIL, IUsuario } from './usuarios.model';

export class UsuariosService {
    async getAll() {
        return Usuario.find().sort({ createdAt: -1 });
    }

    async getByEmail(email: string) {
        return Usuario.findOne({ email: email.toLowerCase() });
    }

    async getById(id: string) {
        return Usuario.findById(id);
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
                activo: true,
            });
        } else {
            // Actualizar nombre e imagen
            usuario.nombre = data.nombre;
            if (data.imagen) usuario.imagen = data.imagen;
            await usuario.save();
        }
        
        return usuario;
    }

    // Asignar perfil y permisos
    async asignarPerfil(email: string, perfil: string) {
        const permisos = PERMISOS_POR_PERFIL[perfil as keyof typeof PERMISOS_POR_PERFIL] || [];
        
        return Usuario.findOneAndUpdate(
            { email: email.toLowerCase() },
            { 
                perfil, 
                permisos,
            },
            { new: true }
        );
    }

    // Actualizar permisos personalizados
    async update(id: string, data: Partial<IUsuario>) {
        // Si se cambia el perfil, actualizar permisos automáticamente
        if (data.perfil) {
            data.permisos = PERMISOS_POR_PERFIL[data.perfil as keyof typeof PERMISOS_POR_PERFIL] || [];
        }
        
        return Usuario.findByIdAndUpdate(id, data, { new: true });
    }

    async delete(id: string) {
        return Usuario.findByIdAndDelete(id);
    }
}

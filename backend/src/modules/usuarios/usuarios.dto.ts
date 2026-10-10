import { z } from 'zod';

export const CreateUsuarioSchema = z.object({
    nombre: z.string().trim().min(1).max(200),
    email: z.string().trim().toLowerCase().email().max(254),
    password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres').max(128),
    perfiles: z.array(z.string().regex(/^[a-z][a-z0-9_]{1,63}$/)).min(1).max(30),
    empresaId: z.string().regex(/^[a-f0-9]{24}$/i),
    choferId: z.string().optional(),
    activo: z.boolean().default(true),
});

export const LoginUsuarioSchema = z.object({
    email: z.string().trim().toLowerCase().email().max(254),
    password: z.string().min(1).max(128),
});

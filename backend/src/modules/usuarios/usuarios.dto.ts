import { z } from 'zod';

export const CreateUsuarioSchema = z.object({
    usuario: z.string().trim().toLowerCase().min(3, 'El usuario debe tener al menos 3 caracteres').max(64).regex(/^[a-z0-9][a-z0-9._-]*$/, 'Usá letras, números, puntos, guiones o guiones bajos').optional(),
    nombre: z.string().trim().min(1).max(200),
    email: z.union([z.string().trim().toLowerCase().email('Ingresá un email válido, por ejemplo nombre@empresa.com').max(254), z.literal('')]).optional(),
    password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres').max(128),
    perfiles: z.array(z.string().regex(/^[a-z][a-z0-9_]{1,63}$/)).min(1).max(30),
    empresaId: z.string().regex(/^[a-f0-9]{24}$/i),
    choferId: z.union([z.string().regex(/^[a-f0-9]{24}$/i), z.literal('')]).optional(),
    activo: z.boolean().default(true),
}).refine(data => !!data.usuario || !!data.email, { message: 'Ingresá un nombre de usuario', path: ['usuario'] });

export const LoginUsuarioSchema = z.object({
    email: z.string().trim().toLowerCase().min(1, 'Ingresá tu usuario').max(254),
    password: z.string().min(1).max(128),
});

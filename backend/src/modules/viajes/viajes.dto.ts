import { z } from 'zod';

// Estados válidos para viajes
const estadoValues = ['pendiente', 'en_transito', 'finalizado', 'cancelado'] as const;

// Schema para crear viaje
export const CreateViajeSchema = z.object({
    origen: z.string().min(1, 'El origen es requerido'),
    destino: z.string().min(1, 'El destino es requerido'),
    fecha_salida: z.string().optional(),
    fecha_llegada: z.string().optional(),
    estado: z.enum(estadoValues).default('pendiente'),
    carga: z.string().optional(),
    tipoCarga: z.string().optional(),
    proveedor: z.string().optional(),
    proveedorId: z.string().optional(),
    tipoAsignacion: z.enum(['chofer', 'fletero', 'ninguno']).optional(),
    asignadoId: z.string().optional(),
});

// Schema para actualizar viaje (todos los campos opcionales)
export const UpdateViajeSchema = z.object({
    origen: z.string().min(1).optional(),
    destino: z.string().min(1).optional(),
    fecha_salida: z.string().optional(),
    fecha_llegada: z.string().optional(),
    estado: z.enum(estadoValues).optional(),
    carga: z.string().optional(),
    tipoCarga: z.string().optional(),
    proveedor: z.string().optional(),
    proveedorId: z.string().optional(),
    tipoAsignacion: z.enum(['chofer', 'fletero', 'ninguno']).optional(),
    asignadoId: z.string().optional(),
});

// Tipos inferidos de los schemas
export type CreateViajeDto = z.infer<typeof CreateViajeSchema>;
export type UpdateViajeDto = z.infer<typeof UpdateViajeSchema>;

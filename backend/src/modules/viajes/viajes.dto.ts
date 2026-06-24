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
    tarifaTotalAr: z.number().optional(),
    tarifaChoferPorcentaje: z.number().optional(),
    tarifaChoferAr: z.number().optional(),
    tarifaTotalUsd: z.number().optional(),
    tarifaChoferUsd: z.number().optional(),
    tarifaChoferUsdAr: z.number().optional(),
    estadiaCh: z.number().optional(),
    estadiaAr: z.number().optional(),
    totalChofer: z.number().optional(),
    viaticoChileno: z.number().optional(),
    peajeCh: z.number().optional(),
    devolCh: z.number().optional(),
    restoCh: z.number().optional(),
    viaticoArgentino: z.number().optional(),
    peajeAr: z.number().optional(),
    devolAr: z.number().optional(),
    restoAr: z.number().optional(),
    adelantoMonto: z.number().optional(),
    adelantoMoneda: z.string().optional(),
    adelantoAr: z.number().optional(),
    pago: z.number().optional(),
    subtotal: z.number().optional(),
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
    tarifaTotalAr: z.number().optional(),
    tarifaChoferPorcentaje: z.number().optional(),
    tarifaChoferAr: z.number().optional(),
    tarifaTotalUsd: z.number().optional(),
    tarifaChoferUsd: z.number().optional(),
    tarifaChoferUsdAr: z.number().optional(),
    estadiaCh: z.number().optional(),
    estadiaAr: z.number().optional(),
    totalChofer: z.number().optional(),
    viaticoChileno: z.number().optional(),
    peajeCh: z.number().optional(),
    devolCh: z.number().optional(),
    restoCh: z.number().optional(),
    viaticoArgentino: z.number().optional(),
    peajeAr: z.number().optional(),
    devolAr: z.number().optional(),
    restoAr: z.number().optional(),
    adelantoMonto: z.number().optional(),
    adelantoMoneda: z.string().optional(),
    adelantoAr: z.number().optional(),
    pago: z.number().optional(),
    subtotal: z.number().optional(),
});

// Tipos inferidos de los schemas
export type CreateViajeDto = z.infer<typeof CreateViajeSchema>;
export type UpdateViajeDto = z.infer<typeof UpdateViajeSchema>;

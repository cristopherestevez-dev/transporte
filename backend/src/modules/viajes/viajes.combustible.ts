import { z } from 'zod';

export const cargaCombustibleSchema = z.object({
    registroId: z.uuid(),
    camionId: z.string().regex(/^[a-f0-9]{24}$/i),
    importe: z.number().positive().max(999_999_999_999).multipleOf(0.01),
    moneda: z.enum(['ARS', 'USD', 'CLP']),
    fecha: z.iso.date(),
});

export type CargaCombustibleInput = z.infer<typeof cargaCombustibleSchema>;
export type CargaCombustible = CargaCombustibleInput & { patente: string };

import { Router, Request, Response } from 'express';
import { asyncHandler } from '../../shared/asyncHandler';
import { AppError } from '../../shared/errors/AppError';
import { CobranzaNacionalModel, CobranzaInternacionalModel, PagoNacionalModel, PagoInternacionalModel } from './facturacion.model';

export function validarArchivo(body: any) {
    const { nombre, tipo, contenido } = body || {};
    if (typeof nombre !== 'string' || !nombre.trim() || nombre.length > 200 || !['application/pdf', 'image/jpeg'].includes(tipo) || typeof contenido !== 'string' || !/^[A-Za-z0-9+/]+={0,2}$/.test(contenido)) throw new AppError('Adjuntá una factura en PDF o JPG', 400);
    const data = Buffer.from(contenido, 'base64');
    if (!data.length || data.length > 5 * 1024 * 1024) throw new AppError('El archivo debe tener como máximo 5 MB', 400);
    const valid = tipo === 'application/pdf' ? data.subarray(0, 5).toString() === '%PDF-' : data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff;
    if (!valid) throw new AppError('El contenido del archivo no corresponde a un PDF o JPG', 400);
    return { nombre: nombre.trim().replace(/[\\/\r\n]/g, '_'), tipo, tamaño: data.length, data };
}

export const archivosRoutes = Router();
for (const [path, model] of Object.entries({ 'cobranzas/nacionales': CobranzaNacionalModel, 'cobranzas/internacionales': CobranzaInternacionalModel, 'pagos/nacionales': PagoNacionalModel, 'pagos/internacionales': PagoInternacionalModel })) {
  for (const [route, field] of [['archivo', 'archivoFactura'], ['comprobante', 'archivoPago']]) {
    archivosRoutes.post(`/${path}/:id/${route}`, asyncHandler(async (req: Request, res: Response) => {
        const archivo = validarArchivo(req.body);
        const item = await model.findOneAndUpdate({ _id: req.params.id }, { $set: { [field]: archivo } }, { new: true, runValidators: true });
        if (!item) throw new AppError('Comprobante no encontrado', 404);
        res.json({ status: 'success', data: { nombre: archivo.nombre, tipo: archivo.tipo, tamaño: archivo.tamaño } });
    }));
    archivosRoutes.get(`/${path}/:id/${route}`, asyncHandler(async (req: Request, res: Response) => {
        const item: any = await model.findById(req.params.id).select(`+${field}.data`);
        if (!item?.[field]?.data) throw new AppError('Este comprobante todavía no tiene un archivo adjunto', 404);
        res.set({ 'Content-Type': item[field].tipo, 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' });
        res.send(item[field].data);
    }));
  }
}

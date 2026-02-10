import { Request, Response, NextFunction } from 'express';
import { MantenimientoService } from './mantenimiento.service';

const mantenimientoService = new MantenimientoService();

export class MantenimientoController {
    getByVehiculo = async (req: Request, res: Response, next: NextFunction) => {
        const registros = await mantenimientoService.getByVehiculo(req.params.vehiculoId);
        res.status(200).json({
            status: 'success',
            results: registros.length,
            data: registros,
        });
    };

    search = async (req: Request, res: Response, next: NextFunction) => {
        const { fecha, kmMin, kmMax } = req.query;
        const filters: any = {};

        if (fecha) filters.fecha = fecha as string;
        if (kmMin) filters.kmMin = parseFloat(kmMin as string);
        if (kmMax) filters.kmMax = parseFloat(kmMax as string);

        const registros = await mantenimientoService.search(req.params.vehiculoId, filters);
        res.status(200).json({
            status: 'success',
            results: registros.length,
            data: registros,
        });
    };

    create = async (req: Request, res: Response, next: NextFunction) => {
        const data = { ...req.body, vehiculoId: req.params.vehiculoId };
        const registro = await mantenimientoService.create(data);
        res.status(201).json({
            status: 'success',
            data: registro,
        });
    };

    update = async (req: Request, res: Response, next: NextFunction) => {
        const registro = await mantenimientoService.update(req.params.id, req.body);
        res.status(200).json({
            status: 'success',
            data: registro,
        });
    };

    delete = async (req: Request, res: Response, next: NextFunction) => {
        await mantenimientoService.delete(req.params.id);
        res.status(204).json({
            status: 'success',
            data: null,
        });
    };
}

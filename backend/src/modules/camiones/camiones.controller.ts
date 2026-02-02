import { Request, Response, NextFunction } from 'express';
import { CamionesService } from './camiones.service';

const camionesService = new CamionesService();

export class CamionesController {
    getAll = async (req: Request, res: Response, next: NextFunction) => {
        const camiones = await camionesService.getAll();
        res.status(200).json({
            status: 'success',
            results: camiones.length,
            data: camiones,
        });
    };

    getOne = async (req: Request, res: Response, next: NextFunction) => {
        const camion = await camionesService.getById(req.params.id);
        res.status(200).json({
            status: 'success',
            data: camion,
        });
    };

    create = async (req: Request, res: Response, next: NextFunction) => {
        const camion = await camionesService.create(req.body);
        res.status(201).json({
            status: 'success',
            data: camion,
        });
    };

    update = async (req: Request, res: Response, next: NextFunction) => {
        const camion = await camionesService.update(req.params.id, req.body);
        res.status(200).json({
            status: 'success',
            data: camion,
        });
    };

    delete = async (req: Request, res: Response, next: NextFunction) => {
        await camionesService.delete(req.params.id);
        res.status(204).json({
            status: 'success',
            data: null,
        });
    };
}

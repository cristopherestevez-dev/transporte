import { Request, Response, NextFunction } from 'express';
import { ChoferesService } from './choferes.service';

const choferesService = new ChoferesService();

export class ChoferesController {
    getAll = async (req: Request, res: Response, next: NextFunction) => {
        const choferes = await choferesService.getAll();
        res.status(200).json({
            status: 'success',
            results: choferes.length,
            data: choferes,
        });
    };

    getOne = async (req: Request, res: Response, next: NextFunction) => {
        const chofer = await choferesService.getById(req.params.id);
        res.status(200).json({
            status: 'success',
            data: chofer,
        });
    };

    create = async (req: Request, res: Response, next: NextFunction) => {
        const chofer = await choferesService.create(req.body);
        res.status(201).json({
            status: 'success',
            data: chofer,
        });
    };

    update = async (req: Request, res: Response, next: NextFunction) => {
        const chofer = await choferesService.update(req.params.id, req.body);
        res.status(200).json({
            status: 'success',
            data: chofer,
        });
    };

    delete = async (req: Request, res: Response, next: NextFunction) => {
        await choferesService.delete(req.params.id);
        res.status(204).json({
            status: 'success',
            data: null,
        });
    };
}

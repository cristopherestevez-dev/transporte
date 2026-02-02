import { Request, Response, NextFunction } from 'express';
import { FleterosService } from './fleteros.service';

const fleterosService = new FleterosService();

export class FleterosController {
    getAll = async (req: Request, res: Response, next: NextFunction) => {
        const fleteros = await fleterosService.getAll();
        res.status(200).json({
            status: 'success',
            results: fleteros.length,
            data: fleteros,
        });
    };

    getOne = async (req: Request, res: Response, next: NextFunction) => {
        const fletero = await fleterosService.getById(req.params.id);
        res.status(200).json({
            status: 'success',
            data: fletero,
        });
    };

    create = async (req: Request, res: Response, next: NextFunction) => {
        const fletero = await fleterosService.create(req.body);
        res.status(201).json({
            status: 'success',
            data: fletero,
        });
    };

    update = async (req: Request, res: Response, next: NextFunction) => {
        const fletero = await fleterosService.update(req.params.id, req.body);
        res.status(200).json({
            status: 'success',
            data: fletero,
        });
    };

    delete = async (req: Request, res: Response, next: NextFunction) => {
        await fleterosService.delete(req.params.id);
        res.status(204).json({
            status: 'success',
            data: null,
        });
    };
}

import { Request, Response, NextFunction } from 'express';
import { SemirremolquesService } from './semirremolques.service';

const semirremolquesService = new SemirremolquesService();

export class SemirremolquesController {
    getAll = async (req: Request, res: Response, next: NextFunction) => {
        const semirremolques = await semirremolquesService.getAll();
        res.status(200).json({
            status: 'success',
            results: semirremolques.length,
            data: semirremolques,
        });
    };

    getOne = async (req: Request, res: Response, next: NextFunction) => {
        const semirremolque = await semirremolquesService.getById(req.params.id);
        res.status(200).json({
            status: 'success',
            data: semirremolque,
        });
    };

    create = async (req: Request, res: Response, next: NextFunction) => {
        const semirremolque = await semirremolquesService.create(req.body);
        res.status(201).json({
            status: 'success',
            data: semirremolque,
        });
    };

    update = async (req: Request, res: Response, next: NextFunction) => {
        const semirremolque = await semirremolquesService.update(req.params.id, req.body);
        res.status(200).json({
            status: 'success',
            data: semirremolque,
        });
    };

    delete = async (req: Request, res: Response, next: NextFunction) => {
        await semirremolquesService.delete(req.params.id);
        res.status(204).json({
            status: 'success',
            data: null,
        });
    };
}

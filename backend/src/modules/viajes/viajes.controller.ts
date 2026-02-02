import { Request, Response, NextFunction } from 'express';
import { ViajesService, viajesNacionalesService, viajesInternacionalesService } from './viajes.service';

export class ViajesController {
    private service: ViajesService;

    constructor(tipo: 'nacional' | 'internacional') {
        this.service = tipo === 'nacional' ? viajesNacionalesService : viajesInternacionalesService;
    }

    getAll = async (req: Request, res: Response, next: NextFunction) => {
        const viajes = await this.service.getAll();
        res.status(200).json({
            status: 'success',
            results: viajes.length,
            data: viajes,
        });
    };

    getOne = async (req: Request, res: Response, next: NextFunction) => {
        const viaje = await this.service.getById(req.params.id);
        res.status(200).json({
            status: 'success',
            data: viaje,
        });
    };

    create = async (req: Request, res: Response, next: NextFunction) => {
        const viaje = await this.service.create(req.body);
        res.status(201).json({
            status: 'success',
            data: viaje,
        });
    };

    update = async (req: Request, res: Response, next: NextFunction) => {
        const viaje = await this.service.update(req.params.id, req.body);
        res.status(200).json({
            status: 'success',
            data: viaje,
        });
    };

    delete = async (req: Request, res: Response, next: NextFunction) => {
        await this.service.delete(req.params.id);
        res.status(204).json({
            status: 'success',
            data: null,
        });
    };
}

export const viajesNacionalesController = new ViajesController('nacional');
export const viajesInternacionalesController = new ViajesController('internacional');

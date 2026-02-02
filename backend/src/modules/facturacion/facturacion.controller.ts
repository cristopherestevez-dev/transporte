import { Request, Response, NextFunction } from 'express';
import {
    FacturacionService,
    cobranzasNacionalesService,
    cobranzasInternacionalesService,
    pagosNacionalesService,
    pagosInternacionalesService
} from './facturacion.service';

class FacturacionController {
    private service: FacturacionService;

    constructor(service: FacturacionService) {
        this.service = service;
    }

    getAll = async (req: Request, res: Response, next: NextFunction) => {
        const items = await this.service.getAll();
        res.status(200).json({
            status: 'success',
            results: items.length,
            data: items,
        });
    };

    getOne = async (req: Request, res: Response, next: NextFunction) => {
        const item = await this.service.getById(req.params.id);
        res.status(200).json({
            status: 'success',
            data: item,
        });
    };

    create = async (req: Request, res: Response, next: NextFunction) => {
        const item = await this.service.create(req.body);
        res.status(201).json({
            status: 'success',
            data: item,
        });
    };

    update = async (req: Request, res: Response, next: NextFunction) => {
        const item = await this.service.update(req.params.id, req.body);
        res.status(200).json({
            status: 'success',
            data: item,
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

export const cobranzasNacionalesController = new FacturacionController(cobranzasNacionalesService);
export const cobranzasInternacionalesController = new FacturacionController(cobranzasInternacionalesService);
export const pagosNacionalesController = new FacturacionController(pagosNacionalesService);
export const pagosInternacionalesController = new FacturacionController(pagosInternacionalesService);

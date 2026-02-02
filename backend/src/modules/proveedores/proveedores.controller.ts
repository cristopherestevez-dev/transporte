import { Request, Response, NextFunction } from 'express';
import { ProveedoresService } from './proveedores.service';

const proveedoresService = new ProveedoresService();

export class ProveedoresController {
    getAll = async (req: Request, res: Response, next: NextFunction) => {
        const proveedores = await proveedoresService.getAll();
        res.status(200).json({
            status: 'success',
            results: proveedores.length,
            data: proveedores,
        });
    };

    getOne = async (req: Request, res: Response, next: NextFunction) => {
        const proveedor = await proveedoresService.getById(req.params.id);
        res.status(200).json({
            status: 'success',
            data: proveedor,
        });
    };

    create = async (req: Request, res: Response, next: NextFunction) => {
        const proveedor = await proveedoresService.create(req.body);
        res.status(201).json({
            status: 'success',
            data: proveedor,
        });
    };

    update = async (req: Request, res: Response, next: NextFunction) => {
        const proveedor = await proveedoresService.update(req.params.id, req.body);
        res.status(200).json({
            status: 'success',
            data: proveedor,
        });
    };

    delete = async (req: Request, res: Response, next: NextFunction) => {
        await proveedoresService.delete(req.params.id);
        res.status(204).json({
            status: 'success',
            data: null,
        });
    };
}

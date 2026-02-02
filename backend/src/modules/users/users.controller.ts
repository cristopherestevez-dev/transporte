import { Request, Response, NextFunction } from 'express';
import { UsersService } from './users.service';

const usersService = new UsersService();

export class UsersController {
    async getAll(req: Request, res: Response, next: NextFunction) {
        const users = await usersService.getAllUsers();
        res.status(200).json({
            status: 'success',
            data: { users },
        });
    }

    async getOne(req: Request, res: Response, next: NextFunction) {
        const user = await usersService.getUserById(req.params.id);
        res.status(200).json({
            status: 'success',
            data: { user },
        });
    }

    async update(req: Request, res: Response, next: NextFunction) {
        const user = await usersService.updateUser(req.params.id, req.body);
        res.status(200).json({
            status: 'success',
            data: { user },
        });
    }

    async delete(req: Request, res: Response, next: NextFunction) {
        await usersService.deleteUser(req.params.id);
        res.status(204).json({
            status: 'success',
            data: null,
        });
    }
}

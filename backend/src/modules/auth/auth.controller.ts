import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';

const authService = new AuthService();

export class AuthController {
    async register(req: Request, res: Response, next: NextFunction) {
        const user = await authService.register(req.body);
        res.status(201).json({
            status: 'success',
            data: { user },
        });
    }

    async login(req: Request, res: Response, next: NextFunction) {
        const { user, token } = await authService.login(req.body);
        res.status(200).json({
            status: 'success',
            data: { user, token },
        });
    }
}

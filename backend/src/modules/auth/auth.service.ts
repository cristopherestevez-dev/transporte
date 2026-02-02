import { AuthRepository } from './auth.repository';
import { LoginDto, RegisterDto } from './auth.dto';
import { AppError } from '../../shared/errors/AppError';
// Note: In a real app, use bcrypt related logic here. Assuming basic setup for now.

export class AuthService {
    private authRepository: AuthRepository;

    constructor() {
        this.authRepository = new AuthRepository();
    }

    async register(data: RegisterDto) {
        const existingUser = await this.authRepository.findUserByEmail(data.email);
        if (existingUser) {
            throw new AppError('Email already in use', 400);
        }
        // TODO: Hash password here
        const user = await this.authRepository.createUser(data);
        return user;
    }

    async login(data: LoginDto) {
        const user = await this.authRepository.findUserByEmail(data.email);
        // TODO: Compare password here
        if (!user || user.password !== data.password) {
            throw new AppError('Invalid credentials', 401);
        }
        // TODO: Generate JWT here
        return { user, token: 'dummy-token' };
    }
}

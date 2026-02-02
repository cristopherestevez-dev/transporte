import { UsersRepository } from './users.repository';
import { AppError } from '../../shared/errors/AppError';

export class UsersService {
    private usersRepository: UsersRepository;

    constructor() {
        this.usersRepository = new UsersRepository();
    }

    async getAllUsers() {
        return this.usersRepository.findAll();
    }

    async getUserById(id: string) {
        const user = await this.usersRepository.findById(id);
        if (!user) {
            throw new AppError('User not found', 404);
        }
        return user;
    }

    async updateUser(id: string, data: any) {
        const user = await this.usersRepository.update(id, data);
        if (!user) {
            throw new AppError('User not found', 404);
        }
        return user;
    }

    async deleteUser(id: string) {
        const user = await this.usersRepository.delete(id);
        if (!user) {
            throw new AppError('User not found', 404);
        }
        return user;
    }

    async countUsers(): Promise<number> {
        return this.usersRepository.count();
    }
}

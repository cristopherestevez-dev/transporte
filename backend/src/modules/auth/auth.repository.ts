import { UserModel, IUser } from '../users/users.model';
import { RegisterDto } from './auth.dto';

export class AuthRepository {
    async findUserByEmail(email: string): Promise<IUser | null> {
        return UserModel.findOne({ email }).select('+password');
    }

    async createUser(userData: RegisterDto): Promise<IUser> {
        return UserModel.create(userData);
    }
}

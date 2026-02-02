import { UserModel, IUser } from './users.model';

export class UsersRepository {
    async findAll(): Promise<IUser[]> {
        return UserModel.find();
    }

    async findById(id: string): Promise<IUser | null> {
        return UserModel.findById(id);
    }

    async update(id: string, data: Partial<IUser>): Promise<IUser | null> {
        return UserModel.findByIdAndUpdate(id, data, { new: true });
    }

    async delete(id: string): Promise<IUser | null> {
        return UserModel.findByIdAndDelete(id);
    }

    async count(): Promise<number> {
        return UserModel.countDocuments();
    }
}

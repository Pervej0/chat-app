import { IUser, User } from "../../models";
import { hashPassword } from "../../utils/auth.utils";

export interface CreateUserDto {
  email: string;
  password: string;
  name: string;
}

export interface UpdateUserDto {
  name?: string;
  email?: string;
}

export const userService = {
  async create(dto: CreateUserDto): Promise<IUser> {
    const hashedPassword = hashPassword(dto.password);
    const user = await User.create({
      email: dto.email,
      password: hashedPassword,
      name: dto.name,
    });
    return user;
  },

  async findByEmail(email: string): Promise<IUser | null> {
    return User.findOne({ email: email.toLowerCase() });
  },

  async findById(id: string): Promise<IUser | null> {
    return User.findById(id);
  },

  async update(id: string, dto: UpdateUserDto): Promise<IUser | null> {
    const updateData: Record<string, unknown> = {};
    if (dto.name) updateData.name = dto.name;
    if (dto.email) updateData.email = dto.email.toLowerCase();

    return User.findByIdAndUpdate(id, updateData, { new: true });
  },

  async delete(id: string): Promise<boolean> {
    const result = await User.findByIdAndDelete(id);
    return result !== null;
  },

  async getProfile(id: string): Promise<IUser | null> {
    return User.findById(id).select("-password");
  },

  async getUsers(role: string = "user"): Promise<IUser[]> {
    if (role == "admin") {
      return User.find().select("-password");
    }
    return User.find({ role: "user" }).select("-password");
  },
};

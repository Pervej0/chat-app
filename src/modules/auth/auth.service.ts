import { IUser } from "../../models";
import {
  hashPassword,
  verifyPassword,
  generateTokens,
  verifyAccessToken,
  verifyRefreshToken,
} from "../../utils/auth.utils";
import { userService } from "../user/user.service";
import { TokenPayload, AuthTokens } from "../../types";

// In-memory store for refresh tokens (could be moved to Redis in production)
const refreshTokens: Set<string> = new Set();

export const authService = {
  async createUser(email: string, password: string, name: string): Promise<IUser> {
    return userService.create({ email, password, name });
  },

  async findUserByEmail(email: string): Promise<IUser | null> {
    return userService.findByEmail(email);
  },

  async findUserById(id: string): Promise<IUser | null> {
    return userService.findById(id);
  },

  generateTokens(user: IUser): AuthTokens {
    const payload: TokenPayload = { userId: user.id, email: user.email };
    return generateTokens({ id: user.id, email: user.email, passwordHash: "", createdAt: new Date() } as any);
  },

  verifyAccessToken,
  verifyRefreshToken,

  hashPassword,
  verifyPassword,

  storeRefreshToken(token: string): void {
    refreshTokens.add(token);
  },

  removeRefreshToken(token: string): void {
    refreshTokens.delete(token);
  },

  isRefreshTokenValid(token: string): boolean {
    return refreshTokens.has(token);
  },
};
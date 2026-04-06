import crypto from "crypto";
import { User } from "../../types";
import {
  hashPassword,
  verifyPassword,
  generateTokens,
  verifyAccessToken,
  verifyRefreshToken,
} from "../../utils/auth.utils";

// In-memory stores (replace with database in production)
const users: Map<string, User> = new Map();
const refreshTokens: Set<string> = new Set();

function createUser(email: string, password: string): User {
  const id = crypto.randomUUID();
  const user: User = {
    id,
    email,
    passwordHash: hashPassword(password),
    createdAt: new Date(),
  };
  users.set(id, user);
  return user;
}

function findUserByEmail(email: string): User | undefined {
  for (const user of users.values()) {
    if (user.email === email) return user;
  }
  return undefined;
}

function findUserById(id: string): User | undefined {
  return users.get(id);
}

function storeRefreshToken(token: string): void {
  refreshTokens.add(token);
}

function removeRefreshToken(token: string): void {
  refreshTokens.delete(token);
}

function isRefreshTokenValid(token: string): boolean {
  return refreshTokens.has(token);
}

export const authService = {
  generateTokens,
  verifyAccessToken,
  verifyRefreshToken,
  hashPassword,
  verifyPassword,
  createUser,
  findUserByEmail,
  findUserById,
  storeRefreshToken,
  removeRefreshToken,
  isRefreshTokenValid,
};
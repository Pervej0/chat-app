import jwt, { SignOptions } from "jsonwebtoken";
import crypto from "crypto";
import { config } from "../../config";
import { User, TokenPayload, AuthTokens } from "../../types";

// In-memory stores (replace with database in production)
const users: Map<string, User> = new Map();
const refreshTokens: Set<string> = new Set();

// Password hashing using PBKDF2
const SALT_LENGTH = 32;
const KEY_LENGTH = 64;
const ITERATIONS = 10000;

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(SALT_LENGTH).toString("hex");
  const hash = crypto
    .pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, "sha512")
    .toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, storedHash: string): boolean {
  const [salt, hash] = storedHash.split(":");
  const verifyHash = crypto
    .pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, "sha512")
    .toString("hex");
  return hash === verifyHash;
}

// Token generation
function generateTokens(user: User): AuthTokens {
  const payload: TokenPayload = { userId: user.id, email: user.email };

  const accessToken = jwt.sign(payload, config.jwt.secret as string, {
    expiresIn: config.jwt.accessExpiry as SignOptions["expiresIn"],
  });

  const refreshToken = jwt.sign(payload, config.jwt.secret as string, {
    expiresIn: config.jwt.refreshExpiry as SignOptions["expiresIn"],
  });

  return { accessToken, refreshToken };
}

// Token verification
function verifyAccessToken(token: string): TokenPayload {
  return jwt.verify(token, config.jwt.secret) as TokenPayload;
}

function verifyRefreshToken(token: string): TokenPayload {
  return jwt.verify(token, config.jwt.secret) as TokenPayload;
}

// User management
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

// Refresh token management
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
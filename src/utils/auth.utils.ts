import jwt, { SignOptions } from "jsonwebtoken";
import crypto from "crypto";
import { config } from "../core";
import { User, TokenPayload, AuthTokens } from "../types";

// Password hashing constants
const SALT_LENGTH = 32;
const KEY_LENGTH = 64;
const ITERATIONS = 10000;

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(SALT_LENGTH).toString("hex");
  const hash = crypto
    .pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, "sha512")
    .toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const [salt, hash] = storedHash.split(":");
  const verifyHash = crypto
    .pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, "sha512")
    .toString("hex");
  return hash === verifyHash;
}

export function generateTokens(user: User): AuthTokens {
  const payload: TokenPayload = { userId: user.id, email: user.email, role: user.role };

  const accessToken = jwt.sign(payload, config.jwt.secret as string, {
    expiresIn: config.jwt.accessExpiry as SignOptions["expiresIn"],
  });

  const refreshToken = jwt.sign(payload, config.jwt.secret as string, {
    expiresIn: config.jwt.refreshExpiry as SignOptions["expiresIn"],
  });

  return { accessToken, refreshToken };
}

export function verifyAccessToken(token: string): TokenPayload {
  return jwt.verify(token, config.jwt.secret) as TokenPayload;
}

export function verifyRefreshToken(token: string): TokenPayload {
  return jwt.verify(token, config.jwt.secret) as TokenPayload;
}

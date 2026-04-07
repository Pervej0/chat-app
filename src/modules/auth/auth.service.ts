import crypto from "crypto";
import { IUser, IAuth, Auth, User } from "../../models";
import {
  hashPassword,
  verifyPassword,
  generateTokens,
  verifyAccessToken,
  verifyRefreshToken,
} from "../../utils/auth.utils";
import { TokenPayload, AuthTokens } from "../../types";

export interface RegisterDto {
  email: string;
  password: string;
  name: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface ForgotPasswordDto {
  email: string;
}

export const authService = {
  async register(dto: RegisterDto): Promise<{ user: IUser; tokens: AuthTokens }> {
    // Check if user already exists
    const existingUser = await User.findOne({ email: dto.email.toLowerCase() });
    if (existingUser) {
      throw new Error("EMAIL_EXISTS");
    }

    // Create user
    const hashedPassword = hashPassword(dto.password);
    const user = await User.create({
      email: dto.email.toLowerCase(),
      password: hashedPassword,
      name: dto.name,
    });

    // Create auth record with user relationship
    await Auth.create({ user: user._id });

    // Generate tokens
    const tokens = generateTokens({
      id: user.id,
      email: user.email,
      passwordHash: user.password,
      createdAt: user.createdAt,
    } as any);

    return { user, tokens };
  },

  async login(dto: LoginDto): Promise<{ user: IUser; tokens: AuthTokens }> {
    const user = await User.findOne({ email: dto.email.toLowerCase() });
    if (!user) {
      throw new Error("INVALID_CREDENTIALS");
    }

    const isValidPassword = verifyPassword(dto.password, user.password);
    if (!isValidPassword) {
      throw new Error("INVALID_CREDENTIALS");
    }

    // Generate tokens
    const tokens = generateTokens({
      id: user.id,
      email: user.email,
      passwordHash: user.password,
      createdAt: user.createdAt,
    } as any);

    // Store refresh token in Auth model
    await Auth.findOneAndUpdate(
      { user: user._id },
      { refreshToken: tokens.refreshToken }
    );

    return { user, tokens };
  },

  async logout(userId: string): Promise<void> {
    await Auth.findOneAndUpdate(
      { user: userId },
      { refreshToken: null }
    );
  },

  async refreshToken(
    refreshToken: string
  ): Promise<{ user: IUser; tokens: AuthTokens }> {
    // Verify the refresh token
    const payload = verifyRefreshToken(refreshToken);

    // Find auth record with this refresh token
    const auth = await Auth.findOne({
      refreshToken: refreshToken,
      user: payload.userId,
    }).populate("user");

    if (!auth || !auth.user) {
      throw new Error("INVALID_TOKEN");
    }

    const user = auth.user as unknown as IUser;

    // Generate new tokens
    const tokens = generateTokens({
      id: user.id,
      email: user.email,
      passwordHash: user.password,
      createdAt: user.createdAt,
    } as any);

    // Update refresh token in Auth model
    await Auth.findByIdAndUpdate(auth._id, { refreshToken: tokens.refreshToken });

    return { user, tokens };
  },

  async forgotPassword(dto: ForgotPasswordDto): Promise<void> {
    const user = await User.findOne({ email: dto.email.toLowerCase() });
    if (!user) {
      // Don't reveal if email exists
      return;
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenHash = hashPassword(resetToken);

    // Store reset token (hashed) and expiration (1 hour)
    await Auth.findOneAndUpdate(
      { user: user._id },
      {
        passwordResetToken: resetTokenHash,
        passwordResetExpires: new Date(Date.now() + 60 * 60 * 1000),
      }
    );

    // In production, send email with reset token
    // For now, return the plain token (in real app, send via email)
    return;
  },

  async resetPassword(token: string, newPassword: string): Promise<void> {
    // Find auth with valid reset token
    const auth = await Auth.findOne({
      passwordResetExpires: { $gt: new Date() },
    });

    if (!auth) {
      throw new Error("INVALID_TOKEN");
    }

    // Verify token (stored as hash)
    const isValid = verifyPassword(token, auth.passwordResetToken || "");
    if (!isValid) {
      throw new Error("INVALID_TOKEN");
    }

    // Update password
    const hashedPassword = hashPassword(newPassword);
    await User.findByIdAndUpdate(auth.user, { password: hashedPassword });

    // Clear reset token
    await Auth.findByIdAndUpdate(auth._id, {
      passwordResetToken: null,
      passwordResetExpires: null,
      refreshToken: null, // Invalidate all sessions
    });
  },

  verifyAccessToken,
  verifyRefreshToken,
};
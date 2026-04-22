import { Types } from "mongoose";
import { authService, RegisterDto, LoginDto } from "../auth.service";
import { User, IUser, Auth, IAuth } from "../../../models";
import { hashPassword, verifyPassword, generateTokens, verifyAccessToken, verifyRefreshToken } from "../../../utils/auth.utils";
import { TokenPayload, AuthTokens } from "../../../types";

jest.mock("../../../models");
jest.mock("../../../utils/auth.utils");

const VALID_USER_ID = "507f1f77bcf86cd799439012";
const VALID_USER_ID_2 = "507f1f77bcf86cd799439013";

const mockUser = (overrides: Partial<IUser> = {}): IUser =>
  ({
    _id: new Types.ObjectId(VALID_USER_ID),
    id: VALID_USER_ID,
    email: "test@example.com",
    name: "Test User",
    password: "hashed:password",
    createdAt: new Date(),
    toJSON: jest.fn().mockReturnThis(),
    ...overrides,
  }) as unknown as IUser;

const mockAuth = (overrides: Partial<IAuth> = {}): IAuth =>
  ({
    _id: { toString: () => "507f1f77bcf86cd799439099" },
    user: { toString: () => VALID_USER_ID },
    refreshToken: "mock-refresh-token",
    ...overrides,
  }) as unknown as IAuth;

const mockTokens = (): AuthTokens => ({
  accessToken: "mock-access-token",
  refreshToken: "mock-refresh-token",
});

describe("authService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("register", () => {
    const dto: RegisterDto = {
      email: "test@example.com",
      password: "password123",
      name: "Test User",
    };

    it("throws EMAIL_EXISTS when user already exists", async () => {
      (User.findOne as jest.Mock).mockResolvedValue(mockUser());

      await expect(authService.register(dto)).rejects.toThrow("EMAIL_EXISTS");
      expect(User.findOne).toHaveBeenCalledWith({ email: dto.email.toLowerCase() });
    });

    it("creates user and auth record when email is new", async () => {
      const user = mockUser();
      (User.findOne as jest.Mock).mockResolvedValue(null);
      (User.create as jest.Mock).mockResolvedValue(user);
      (Auth.create as jest.Mock).mockResolvedValue(mockAuth());
      (hashPassword as jest.Mock).mockReturnValue("hashed:password");
      (generateTokens as jest.Mock).mockReturnValue(mockTokens());

      const result = await authService.register(dto);

      expect(User.create).toHaveBeenCalledWith({
        email: dto.email.toLowerCase(),
        password: "hashed:password",
        name: dto.name,
      });
      expect(Auth.create).toHaveBeenCalled();
      expect(result).toHaveProperty("user");
      expect(result).toHaveProperty("tokens");
    });
  });

  describe("login", () => {
    const dto: LoginDto = {
      email: "test@example.com",
      password: "password123",
    };

    it("throws INVALID_CREDENTIALS when user not found", async () => {
      (User.findOne as jest.Mock).mockResolvedValue(null);

      await expect(authService.login(dto)).rejects.toThrow("INVALID_CREDENTIALS");
    });

    it("throws INVALID_CREDENTIALS when password is wrong", async () => {
      const user = mockUser();
      (User.findOne as jest.Mock).mockResolvedValue(user);
      (verifyPassword as jest.Mock).mockReturnValue(false);

      await expect(authService.login(dto)).rejects.toThrow("INVALID_CREDENTIALS");
    });

    it("returns user and tokens on successful login", async () => {
      const user = mockUser();
      (User.findOne as jest.Mock).mockResolvedValue(user);
      (verifyPassword as jest.Mock).mockReturnValue(true);
      (Auth.findOneAndUpdate as jest.Mock).mockResolvedValue(mockAuth());
      (generateTokens as jest.Mock).mockReturnValue(mockTokens());

      const result = await authService.login(dto);

      expect(result).toHaveProperty("user", user);
      expect(result).toHaveProperty("tokens");
      expect(Auth.findOneAndUpdate).toHaveBeenCalledWith(
        { user: user._id },
        { refreshToken: expect.any(String) },
      );
    });
  });

  describe("logout", () => {
    it("clears refresh token in auth record", async () => {
      (Auth.findOneAndUpdate as jest.Mock).mockResolvedValue(mockAuth());

      await authService.logout(VALID_USER_ID);

      expect(Auth.findOneAndUpdate).toHaveBeenCalledWith(
        { user: VALID_USER_ID },
        { refreshToken: null },
      );
    });
  });

  describe("refreshToken", () => {
    it("throws INVALID_TOKEN when auth record not found", async () => {
      (verifyRefreshToken as jest.Mock).mockReturnValue({ userId: VALID_USER_ID, email: "test@test.com", role: "user" } as TokenPayload);
      (Auth.findOne as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue(null),
      });

      await expect(authService.refreshToken("some-token")).rejects.toThrow("INVALID_TOKEN");
    });

    it("returns user and new tokens on valid refresh token", async () => {
      const user = mockUser();
      const auth = mockAuth({ user: user as any });
      (verifyRefreshToken as jest.Mock).mockReturnValue({ userId: VALID_USER_ID, email: user.email, role: user.role } as TokenPayload);
      (Auth.findOne as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue(auth),
      });
      (Auth.findByIdAndUpdate as jest.Mock).mockResolvedValue(auth);
      (generateTokens as jest.Mock).mockReturnValue(mockTokens());

      const result = await authService.refreshToken("valid-refresh-token");

      expect(result).toHaveProperty("user");
      expect(result).toHaveProperty("tokens");
      expect(Auth.findByIdAndUpdate).toHaveBeenCalledWith(auth._id, { refreshToken: expect.any(String) });
    });
  });

  describe("forgotPassword", () => {
    it("does nothing when user not found (security)", async () => {
      (User.findOne as jest.Mock).mockResolvedValue(null);

      await authService.forgotPassword({ email: "notfound@test.com" });

      expect(Auth.findOneAndUpdate).not.toHaveBeenCalled();
    });

    it("generates reset token for existing user", async () => {
      const user = mockUser();
      (User.findOne as jest.Mock).mockResolvedValue(user);
      (hashPassword as jest.Mock).mockReturnValue("hashed:reset-token");
      (Auth.findOneAndUpdate as jest.Mock).mockResolvedValue(mockAuth());

      await authService.forgotPassword({ email: user.email });

      expect(Auth.findOneAndUpdate).toHaveBeenCalledWith(
        { user: user._id },
        expect.objectContaining({
          passwordResetToken: "hashed:reset-token",
          passwordResetExpires: expect.any(Date),
        }),
      );
    });
  });

  describe("resetPassword", () => {
    it("throws INVALID_TOKEN when no valid reset token found", async () => {
      (Auth.findOne as jest.Mock).mockResolvedValue(null);

      await expect(authService.resetPassword("token", "newpassword123")).rejects.toThrow("INVALID_TOKEN");
    });

    it("throws INVALID_TOKEN when token does not match", async () => {
      const auth = mockAuth({ passwordResetToken: "hashed:token", passwordResetExpires: new Date(Date.now() + 60000) });
      (Auth.findOne as jest.Mock).mockResolvedValue(auth);
      (verifyPassword as jest.Mock).mockReturnValue(false);

      await expect(authService.resetPassword("wrong-token", "newpassword123")).rejects.toThrow("INVALID_TOKEN");
    });

    it("updates password and clears reset token on success", async () => {
      const auth = mockAuth({ passwordResetToken: "hashed:valid-token", passwordResetExpires: new Date(Date.now() + 60000) });
      (Auth.findOne as jest.Mock).mockResolvedValue(auth);
      (verifyPassword as jest.Mock).mockReturnValue(true);
      (hashPassword as jest.Mock).mockReturnValue("hashed:new-password");
      (User.findByIdAndUpdate as jest.Mock).mockResolvedValue(mockUser());
      (Auth.findByIdAndUpdate as jest.Mock).mockResolvedValue(auth);

      await authService.resetPassword("valid-token", "newpassword123");

      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(auth.user, { password: "hashed:new-password" });
      expect(Auth.findByIdAndUpdate).toHaveBeenCalledWith(
        auth._id,
        expect.objectContaining({
          passwordResetToken: null,
          passwordResetExpires: null,
          refreshToken: null,
        }),
      );
    });
  });

  describe("verifyAccessToken", () => {
    it("delegates to utils function", () => {
      const token = "some-token";
      const payload: TokenPayload = { userId: VALID_USER_ID, email: "test@test.com", role: "user" };
      (verifyAccessToken as jest.Mock).mockReturnValue(payload);

      const result = authService.verifyAccessToken(token);

      expect(verifyAccessToken).toHaveBeenCalledWith(token);
      expect(result).toEqual(payload);
    });
  });

  describe("verifyRefreshToken", () => {
    it("delegates to utils function", () => {
      const token = "some-refresh-token";
      const payload: TokenPayload = { userId: VALID_USER_ID, email: "test@test.com", role: "user" };
      (verifyRefreshToken as jest.Mock).mockReturnValue(payload);

      const result = authService.verifyRefreshToken(token);

      expect(verifyRefreshToken).toHaveBeenCalledWith(token);
      expect(result).toEqual(payload);
    });
  });
});
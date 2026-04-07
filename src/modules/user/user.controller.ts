import { Response } from "express";
import { userService } from "./user.service";
import { AuthRequest, ApiResponse } from "../../types";

interface UpdateBody {
  name?: string;
  email?: string;
}

export const getProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user?.userId;

  if (!userId) {
    const response: ApiResponse = {
      success: false,
      message: "Unauthorized",
      timestamp: new Date().toISOString(),
    };
    res.status(401).json(response);
    return;
  }

  const user = await userService.getProfile(userId);

  if (!user) {
    const response: ApiResponse = {
      success: false,
      message: "User not found",
      timestamp: new Date().toISOString(),
    };
    res.status(404).json(response);
    return;
  }

  const response: ApiResponse = {
    success: true,
    data: user,
    timestamp: new Date().toISOString(),
  };
  res.status(200).json(response);
};

export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user?.userId;
  const { name, email } = req.body as UpdateBody;

  if (!userId) {
    const response: ApiResponse = {
      success: false,
      message: "Unauthorized",
      timestamp: new Date().toISOString(),
    };
    res.status(401).json(response);
    return;
  }

  if (!name && !email) {
    const response: ApiResponse = {
      success: false,
      message: "At least one field (name or email) is required",
      timestamp: new Date().toISOString(),
    };
    res.status(400).json(response);
    return;
  }

  // Check if email is being changed and if it's already taken
  if (email) {
    const existingUser = await userService.findByEmail(email);
    if (existingUser && existingUser.id !== userId) {
      const response: ApiResponse = {
        success: false,
        message: "Email already in use",
        timestamp: new Date().toISOString(),
      };
      res.status(409).json(response);
      return;
    }
  }

  const user = await userService.update(userId, { name, email });

  if (!user) {
    const response: ApiResponse = {
      success: false,
      message: "User not found",
      timestamp: new Date().toISOString(),
    };
    res.status(404).json(response);
    return;
  }

  const response: ApiResponse = {
    success: true,
    data: user,
    message: "Profile updated successfully",
    timestamp: new Date().toISOString(),
  };
  res.status(200).json(response);
};

export const deleteProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user?.userId;

  if (!userId) {
    const response: ApiResponse = {
      success: false,
      message: "Unauthorized",
      timestamp: new Date().toISOString(),
    };
    res.status(401).json(response);
    return;
  }

  const deleted = await userService.delete(userId);

  if (!deleted) {
    const response: ApiResponse = {
      success: false,
      message: "User not found",
      timestamp: new Date().toISOString(),
    };
    res.status(404).json(response);
    return;
  }

  const response: ApiResponse = {
    success: true,
    message: "Account deleted successfully",
    timestamp: new Date().toISOString(),
  };
  res.status(200).json(response);
};
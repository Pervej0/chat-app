import { Response, NextFunction } from "express";
import { helloService } from "./hello.service";
import { AuthRequest, ApiResponse } from "../../types";
import { CustomError, asyncHandler } from "../../middleware";

interface CreateHelloBody {
  message: string;
}

interface UpdateHelloBody {
  message: string;
}

export const getHello = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const userId = req.user?.userId;
    if (!userId) {
      next(new CustomError("Unauthorized", 401));
      return;
    }

    const helloId = req.params.id as string;
    const hello = await helloService.findById(helloId);

    if (!hello) {
      next(new CustomError("Hello not found", 404));
      return;
    }

    const response: ApiResponse = {
      success: true,
      data: hello,
      timestamp: new Date().toISOString(),
    };
    res.status(200).json(response);
  }
);

export const createHello = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const userId = req.user?.userId;
    if (!userId) {
      next(new CustomError("Unauthorized", 401));
      return;
    }

    const { message } = req.body as CreateHelloBody;
    if (!message) {
      next(new CustomError("Message is required", 400));
      return;
    }

    const hello = await helloService.create({ message }, userId);

    const response: ApiResponse = {
      success: true,
      data: hello,
      message: "Hello created successfully",
      timestamp: new Date().toISOString(),
    };
    res.status(201).json(response);
  }
);

export const updateHello = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const userId = req.user?.userId;
    if (!userId) {
      next(new CustomError("Unauthorized", 401));
      return;
    }

    const helloId = req.params.id as string;
    const { message } = req.body as UpdateHelloBody;
    if (!message) {
      next(new CustomError("Message is required", 400));
      return;
    }

    const hello = await helloService.update(helloId, { message }, userId);

    if (!hello) {
      next(new CustomError("Hello not found or unauthorized", 404));
      return;
    }

    const response: ApiResponse = {
      success: true,
      data: hello,
      message: "Hello updated successfully",
      timestamp: new Date().toISOString(),
    };
    res.status(200).json(response);
  }
);

export const deleteHello = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const userId = req.user?.userId;
    if (!userId) {
      next(new CustomError("Unauthorized", 401));
      return;
    }

    const helloId = req.params.id as string;
    const deleted = await helloService.delete(helloId, userId);

    if (!deleted) {
      next(new CustomError("Hello not found or unauthorized", 404));
      return;
    }

    const response: ApiResponse = {
      success: true,
      message: "Hello deleted successfully",
      timestamp: new Date().toISOString(),
    };
    res.status(200).json(response);
  }
);
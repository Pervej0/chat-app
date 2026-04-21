import { Types } from "mongoose";

export interface HelloDocument {
  _id: Types.ObjectId;
  message: string;
  userId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateHelloDto {
  message: string;
}

export interface UpdateHelloDto {
  message?: string;
}

export const helloService = {
  async create(dto: CreateHelloDto, userId: string): Promise<HelloDocument> {
    // Placeholder: replace with actual model
    return {
      _id: new Types.ObjectId(),
      message: dto.message,
      userId: new Types.ObjectId(userId),
      createdAt: new Date(),
      updatedAt: new Date(),
    } as HelloDocument;
  },

  async findById(id: string): Promise<HelloDocument | null> {
    // Placeholder: replace with actual model query
    return null;
  },

  async update(
    id: string,
    dto: UpdateHelloDto,
    userId: string,
  ): Promise<HelloDocument | null> {
    // Placeholder: replace with actual model query
    // Must return null if userId mismatch (auth failure)
    return null;
  },

  async delete(id: string, userId: string): Promise<boolean> {
    // Placeholder: replace with actual model query
    // Must return false if userId mismatch (auth failure)
    return false;
  },
};
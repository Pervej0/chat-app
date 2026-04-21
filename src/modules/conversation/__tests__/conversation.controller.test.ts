import { Response, NextFunction } from "express";
import {
  createConversation,
  getConversations,
  getConversation,
} from "../conversation.controller";
import { conversationService } from "../conversation.service";
import { AuthRequest } from "../../../types";
import { CustomError } from "../../../middleware";

jest.mock("../conversation.service");

const VALID_USER_ID = "507f1f77bcf86cd799439012";
const VALID_CONV_ID = "507f1f77bcf86cd799439011";
const OTHER_USER_ID = "507f1f77bcf86cd799439013";

describe("conversationController", () => {
  let mockReq: Partial<AuthRequest>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;

  const mockParticipant = (id: string) => ({
    _id: { toString: () => id },
    name: "User",
    email: "user@test.com",
  });

  const mockConversationResponse = () => ({
    _id: { toString: () => VALID_CONV_ID },
    participants: [mockParticipant(VALID_USER_ID), mockParticipant(OTHER_USER_ID)],
    lastMessage: { toString: () => "507f1f77bcf86cd799439014" },
    lastMessageAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    toObject: () => ({
      _id: VALID_CONV_ID,
      participants: [mockParticipant(VALID_USER_ID), mockParticipant(OTHER_USER_ID)],
    }),
  });

  beforeEach(() => {
    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnValue({ json: mockJson });
    mockReq = { user: { userId: VALID_USER_ID, email: "test@test.com" }, body: {}, params: {} };
    mockRes = { status: mockStatus, json: mockJson } as Partial<Response>;
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe("createConversation", () => {
    it("returns 401 if user is not authenticated", async () => {
      mockReq.user = undefined;
      mockReq.body = { participants: [OTHER_USER_ID] };

      await createConversation(
        mockReq as AuthRequest,
        mockRes as Response,
        mockNext,
      );

      expect(mockNext).toHaveBeenCalledWith(expect.any(CustomError));
      const error = (mockNext as jest.Mock).mock.calls[0][0];
      expect(error.message).toBe("Unauthorized");
    });

    it("returns 400 if participants are missing", async () => {
      mockReq.body = {};

      await createConversation(
        mockReq as AuthRequest,
        mockRes as Response,
        mockNext,
      );

      expect(mockNext).toHaveBeenCalledWith(expect.any(CustomError));
      const error = (mockNext as jest.Mock).mock.calls[0][0];
      expect(error.message).toBe("At least one participant is required");
    });

    it("adds current user to participants if not included", async () => {
      mockReq.body = { participants: [OTHER_USER_ID] };
      (conversationService.create as jest.Mock).mockResolvedValue(mockConversationResponse());

      await createConversation(
        mockReq as AuthRequest,
        mockRes as Response,
        mockNext,
      );

      expect(conversationService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          participants: expect.arrayContaining([VALID_USER_ID]),
        }),
        VALID_USER_ID,
      );
    });

    it("does not duplicate user if already in participants", async () => {
      mockReq.body = { participants: [VALID_USER_ID, OTHER_USER_ID] };
      (conversationService.create as jest.Mock).mockResolvedValue(mockConversationResponse());

      await createConversation(
        mockReq as AuthRequest,
        mockRes as Response,
        mockNext,
      );

      const callArgs = (conversationService.create as jest.Mock).mock.calls[0][0];
      expect(callArgs.participants).toEqual([VALID_USER_ID, OTHER_USER_ID]);
    });

    it("returns 201 with conversation on success", async () => {
      mockReq.body = { participants: [OTHER_USER_ID] };
      (conversationService.create as jest.Mock).mockResolvedValue(mockConversationResponse());

      await createConversation(
        mockReq as AuthRequest,
        mockRes as Response,
        mockNext,
      );

      expect(mockStatus).toHaveBeenCalledWith(201);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: "Conversation created successfully",
        }),
      );
    });

    it("returns 500 on service error", async () => {
      mockReq.body = { participants: [OTHER_USER_ID] };
      (conversationService.create as jest.Mock).mockRejectedValue(new Error("DB error"));

      await createConversation(
        mockReq as AuthRequest,
        mockRes as Response,
        mockNext,
      );

      expect(mockNext).toHaveBeenCalledWith(expect.any(CustomError));
    });
  });

  describe("getConversations", () => {
    it("returns 401 if user is not authenticated", async () => {
      mockReq.user = undefined;

      await getConversations(
        mockReq as AuthRequest,
        mockRes as Response,
        mockNext,
      );

      expect(mockNext).toHaveBeenCalledWith(expect.any(CustomError));
      const error = (mockNext as jest.Mock).mock.calls[0][0];
      expect(error.message).toBe("Unauthorized");
    });

    it("calls service with userId", async () => {
      (conversationService.getUserConversations as jest.Mock).mockResolvedValue([]);

      await getConversations(
        mockReq as AuthRequest,
        mockRes as Response,
        mockNext,
      );

      expect(conversationService.getUserConversations).toHaveBeenCalledWith(VALID_USER_ID);
    });

    it("returns 200 with conversations array", async () => {
      const conversations = [mockConversationResponse()];
      (conversationService.getUserConversations as jest.Mock).mockResolvedValue(conversations);

      await getConversations(
        mockReq as AuthRequest,
        mockRes as Response,
        mockNext,
      );

      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: conversations,
        }),
      );
    });

    it("returns 500 on service error", async () => {
      (conversationService.getUserConversations as jest.Mock).mockRejectedValue(
        new Error("DB error"),
      );

      await getConversations(
        mockReq as AuthRequest,
        mockRes as Response,
        mockNext,
      );

      expect(mockNext).toHaveBeenCalledWith(expect.any(CustomError));
    });
  });

  describe("getConversation", () => {
    beforeEach(() => {
      mockReq.params = { conversationId: VALID_CONV_ID };
    });

    it("returns 401 if user is not authenticated", async () => {
      mockReq.user = undefined;

      await getConversation(
        mockReq as AuthRequest,
        mockRes as Response,
        mockNext,
      );

      expect(mockNext).toHaveBeenCalledWith(expect.any(CustomError));
    });

    it("returns 404 if conversation not found", async () => {
      (conversationService.getConversation as jest.Mock).mockResolvedValue(null);

      await getConversation(
        mockReq as AuthRequest,
        mockRes as Response,
        mockNext,
      );

      expect(mockNext).toHaveBeenCalledWith(expect.any(CustomError));
      const error = (mockNext as jest.Mock).mock.calls[0][0];
      expect(error.message).toBe("Conversation not found");
    });

    it("returns 403 if user is not a participant", async () => {
      const nonParticipantConv = {
        ...mockConversationResponse(),
        participants: [mockParticipant(OTHER_USER_ID), mockParticipant("507f1f77bcf86cd799439099")],
      };
      (conversationService.getConversation as jest.Mock).mockResolvedValue(nonParticipantConv);

      await getConversation(
        mockReq as AuthRequest,
        mockRes as Response,
        mockNext,
      );

      expect(mockNext).toHaveBeenCalledWith(expect.any(CustomError));
      const error = (mockNext as jest.Mock).mock.calls[0][0];
      expect(error.message).toBe("Access denied");
    });

    it("returns 200 if user is a participant", async () => {
      (conversationService.getConversation as jest.Mock).mockResolvedValue(
        mockConversationResponse(),
      );

      await getConversation(
        mockReq as AuthRequest,
        mockRes as Response,
        mockNext,
      );

      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
        }),
      );
    });

    it("returns 500 on service error", async () => {
      (conversationService.getConversation as jest.Mock).mockRejectedValue(
        new Error("DB error"),
      );

      await getConversation(
        mockReq as AuthRequest,
        mockRes as Response,
        mockNext,
      );

      expect(mockNext).toHaveBeenCalledWith(expect.any(CustomError));
    });
  });
});
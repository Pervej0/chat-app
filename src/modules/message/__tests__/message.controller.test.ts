import {
  createMessage,
  getMessage,
  getMessages,
  updateMessage,
  deleteMessage,
  markAsRead,
  getUnreadCount,
} from "../message.controller";
import { messageService } from "../message.service";
import { conversationService } from "../../conversation/conversation.service";
import { emitToConversation } from "../../../socket";

jest.mock("../message.service");
jest.mock("../../conversation/conversation.service");
jest.mock("../../../socket", () => ({
  emitToConversation: jest.fn(),
}));

const mockReq = (overrides: Record<string, any> = {}): any => ({
  user: { userId: "user123", email: "test2@example.com", role: "user" },
  body: {},
  params: {},
  query: {},
  ...overrides,
});

const mockRes = (): any => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe("messageController", () => {
  let req: any;
  let res: any;
  let next: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    req = mockReq();
    res = mockRes();
    next = jest.fn();
  });

  describe("createMessage", () => {
    it("returns 401 when user is missing", async () => {
      req.user = undefined;
      await createMessage(req, res, next);
      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 401 }),
      );
    });

    it("returns 400 when conversationId or content is missing", async () => {
      req.body = {};
      await createMessage(req, res, next);
      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 400 }),
      );
    });

    it("returns 404 when conversation not found", async () => {
      req.body = { conversationId: "conv123", content: "Hello" };
      (conversationService.getConversation as jest.Mock).mockResolvedValue(
        null,
      );
      await createMessage(req, res, next);
      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 404 }),
      );
    });

    it("returns 403 when user is not a participant", async () => {
      req.body = { conversationId: "conv123", content: "Hello" };
      (conversationService.getConversation as jest.Mock).mockResolvedValue({
        participants: [{ _id: { toString: () => "otherUser" } }],
      });
      await createMessage(req, res, next);
      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 403 }),
      );
    });

    it("returns 201 and emits socket event on success", async () => {
      req.body = { conversationId: "conv123", content: "Hello" };
      const mockMessage = {
        _id: { toString: () => "msg123" },
        conversationId: { toString: () => "conv123" },
        sender: { toString: () => "user123" },
        content: "Hello",
        createdAt: new Date(),
      };
      const mockPopulated = { ...mockMessage, sender: { name: "John" } };

      (conversationService.getConversation as jest.Mock).mockResolvedValue({
        participants: [{ _id: { toString: () => "user123" } }],
      });
      (messageService.create as jest.Mock).mockResolvedValue(mockMessage);
      (messageService.findById as jest.Mock).mockResolvedValue(mockPopulated);

      await createMessage(req, res, next);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: "Message sent successfully",
        }),
      );
      expect(emitToConversation).toHaveBeenCalledWith(
        "conv123",
        "newMessage",
        expect.any(Object),
      );
    });
  });

  describe("getMessage", () => {
    it("returns 401 when user is missing", async () => {
      req.user = undefined;
      await getMessage(req, res, next);
      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 401 }),
      );
    });

    it("returns 404 when message not found", async () => {
      req.params.messageId = "msg123";
      (messageService.findById as jest.Mock).mockResolvedValue(null);
      await getMessage(req, res, next);
      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 404 }),
      );
    });

    it("returns 200 with message data on success", async () => {
      req.params.messageId = "msg123";
      const mockMessage = { _id: "msg123", content: "Hello" };
      (messageService.findById as jest.Mock).mockResolvedValue(mockMessage);

      await getMessage(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, data: mockMessage }),
      );
    });
  });

  describe("getMessages", () => {
    it("returns 401 when user is missing", async () => {
      req.user = undefined;
      await getMessages(req, res, next);
      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 401 }),
      );
    });

    it("returns 404 when conversation not found", async () => {
      req.params.conversationId = "conv123";
      (conversationService.getConversation as jest.Mock).mockResolvedValue(
        null,
      );
      await getMessages(req, res, next);
      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 404 }),
      );
    });

    it("returns 403 when user is not a participant", async () => {
      req.params.conversationId = "conv123";
      (conversationService.getConversation as jest.Mock).mockResolvedValue({
        participants: [{ _id: { toString: () => "otherUser" } }],
      });
      await getMessages(req, res, next);
      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 403 }),
      );
    });

    it("returns 200 with messages on success", async () => {
      req.params.conversationId = "conv123";
      const mockMessages = [{ _id: "msg1", content: "Hello" }];
      (conversationService.getConversation as jest.Mock).mockResolvedValue({
        participants: [{ _id: { toString: () => "user123" } }],
      });
      (messageService.findByConversation as jest.Mock).mockResolvedValue(
        mockMessages,
      );

      await getMessages(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, data: mockMessages }),
      );
    });
  });

  describe("updateMessage", () => {
    it("returns 401 when user is missing", async () => {
      req.user = undefined;
      await updateMessage(req, res, next);
      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 401 }),
      );
    });

    it("returns 400 when content is missing", async () => {
      req.params.messageId = "msg123";
      req.body = {};
      await updateMessage(req, res, next);
      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 400 }),
      );
    });

    it("returns 404 when message not found", async () => {
      req.params.messageId = "msg123";
      req.body = { content: "Updated" };
      (messageService.update as jest.Mock).mockResolvedValue(null);
      await updateMessage(req, res, next);
      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 404 }),
      );
    });

    it("returns 200 and emits socket event on success", async () => {
      req.params.messageId = "msg123";
      req.body = { content: "Updated" };
      const mockMessage = {
        _id: "msg123",
        content: "Updated",
        conversationId: { toString: () => "conv123" },
      };
      (messageService.update as jest.Mock).mockResolvedValue(mockMessage);

      await updateMessage(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: "Message updated successfully",
        }),
      );
      expect(emitToConversation).toHaveBeenCalledWith(
        "conv123",
        "messageUpdated",
        mockMessage,
      );
    });
  });

  describe("deleteMessage", () => {
    it("returns 401 when user is missing", async () => {
      req.user = undefined;
      await deleteMessage(req, res, next);
      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 401 }),
      );
    });

    it("returns 404 when message not found or unauthorized", async () => {
      req.params.messageId = "msg123";
      (messageService.findById as jest.Mock).mockResolvedValue({
        conversationId: { toString: () => "conv123" },
      });
      (messageService.delete as jest.Mock).mockResolvedValue(false);
      await deleteMessage(req, res, next);
      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 404 }),
      );
    });

    it("returns 200 and emits socket event on success", async () => {
      req.params.messageId = "msg123";
      (messageService.findById as jest.Mock).mockResolvedValue({
        conversationId: { toString: () => "conv123" },
      });
      (messageService.delete as jest.Mock).mockResolvedValue(true);

      await deleteMessage(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: "Message deleted successfully",
        }),
      );
      expect(emitToConversation).toHaveBeenCalledWith(
        "conv123",
        "messageDeleted",
        { messageId: "msg123" },
      );
    });
  });

  describe("markAsRead", () => {
    it("returns 401 when user is missing", async () => {
      req.user = undefined;
      await markAsRead(req, res, next);
      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 401 }),
      );
    });

    it("returns 404 when conversation not found", async () => {
      req.params.conversationId = "conv123";
      (conversationService.getConversation as jest.Mock).mockResolvedValue(
        null,
      );
      await markAsRead(req, res, next);
      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 404 }),
      );
    });

    it("returns 403 when user is not a participant", async () => {
      req.params.conversationId = "conv123";
      (conversationService.getConversation as jest.Mock).mockResolvedValue({
        participants: [{ _id: { toString: () => "otherUser" } }],
      });
      await markAsRead(req, res, next);
      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 403 }),
      );
    });

    it("returns 200 on success", async () => {
      req.params.conversationId = "conv123";
      (conversationService.getConversation as jest.Mock).mockResolvedValue({
        participants: [{ _id: { toString: () => "user123" } }],
      });
      (messageService.markConversationAsRead as jest.Mock).mockResolvedValue({
        modifiedCount: 5,
      });

      await markAsRead(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, data: { modifiedCount: 5 } }),
      );
      expect(emitToConversation).toHaveBeenCalled();
    });
  });

  describe("getUnreadCount", () => {
    it("returns 401 when user is missing", async () => {
      req.user = undefined;
      await getUnreadCount(req, res, next);
      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 401 }),
      );
    });

    it("returns 404 when conversation not found", async () => {
      req.params.conversationId = "conv123";
      (conversationService.getConversation as jest.Mock).mockResolvedValue(
        null,
      );
      await getUnreadCount(req, res, next);
      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 404 }),
      );
    });

    it("returns 403 when user is not a participant", async () => {
      req.params.conversationId = "conv123";
      (conversationService.getConversation as jest.Mock).mockResolvedValue({
        participants: [{ _id: { toString: () => "otherUser" } }],
      });
      await getUnreadCount(req, res, next);
      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 403 }),
      );
    });

    it("returns 200 with unread count on success", async () => {
      req.params.conversationId = "conv123";
      (conversationService.getConversation as jest.Mock).mockResolvedValue({
        participants: [{ _id: { toString: () => "user123" } }],
      });
      (messageService.getUnreadCount as jest.Mock).mockResolvedValue(10);

      await getUnreadCount(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, data: { unreadCount: 10 } }),
      );
    });
  });
});

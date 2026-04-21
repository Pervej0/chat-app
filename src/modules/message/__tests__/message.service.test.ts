import { messageService } from "../message.service";
import { Message, IMessage } from "../../../models/Message";
import { Conversation } from "../../../models/Conversation";

jest.mock("../../../models/Message");
jest.mock("../../../models/Conversation");

const VALID_MSG_ID = "507f1f77bcf86cd799439013";
const VALID_CONV_ID = "507f1f77bcf86cd799439011";
const VALID_USER_ID = "507f1f77bcf86cd799439012";
const WRONG_USER_ID = "507f1f77bcf86cd799439099";

const mockMessage = (overrides: Partial<IMessage> = {}): IMessage =>
  ({
    _id: { toString: () => VALID_MSG_ID },
    conversationId: { toString: () => VALID_CONV_ID },
    sender: { toString: () => VALID_USER_ID },
    content: "Hello",
    readBy: [],
    createdAt: new Date(),
    toObject: jest.fn().mockReturnThis(),
    save: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  }) as unknown as IMessage;

describe("messageService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("create", () => {
    it("creates a message and updates conversation lastMessage", async () => {
      const msg = mockMessage();
      (Message.create as jest.Mock).mockResolvedValue(msg);

      const result = await messageService.create(
        { conversationId: VALID_CONV_ID, content: "Hello" },
        VALID_USER_ID,
      );

      expect(Message.create).toHaveBeenCalledWith({
        conversationId: expect.any(Object),
        sender: expect.any(Object),
        content: "Hello",
      });
      expect(Conversation.findByIdAndUpdate).toHaveBeenCalledWith(
        VALID_CONV_ID,
        expect.objectContaining({
          lastMessage: expect.any(Object),
          lastMessageAt: expect.any(Date),
        }),
      );
      expect(result).toBeDefined();
    });
  });

  describe("findById", () => {
    it("returns message with populated sender", async () => {
      (Message.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockReturnValue({
          toObject: jest.fn().mockReturnValue(mockMessage()),
        }),
      });

      const result = await messageService.findById(VALID_MSG_ID);

      expect(Message.findById).toHaveBeenCalledWith(VALID_MSG_ID);
      expect(result).toBeDefined();
    });

    it("returns null when message not found", async () => {
      (Message.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockReturnValue({
          toObject: jest.fn().mockReturnValue(null),
        }),
      });

      const result = await messageService.findById(VALID_MSG_ID);

      expect(result).toBeNull();
    });
  });

  describe("findByConversation", () => {
    it("queries messages with conversationId filter", async () => {
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([mockMessage()]),
      };
      jest.spyOn(Message, "find").mockReturnValue(mockQuery as any);

      await messageService.findByConversation(VALID_CONV_ID);

      expect(Message.find).toHaveBeenCalledWith(
        expect.objectContaining({ conversationId: expect.any(Object) }),
      );
    });

    it("applies before date filter when provided", async () => {
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([mockMessage()]),
      };
      jest.spyOn(Message, "find").mockReturnValue(mockQuery as any);

      await messageService.findByConversation(VALID_CONV_ID, {
        before: "2024-01-01",
      });

      expect(Message.find).toHaveBeenCalledWith(
        expect.objectContaining({
          createdAt: expect.objectContaining({ $lt: expect.any(Date) }),
        }),
      );
    });

    it("applies after date filter when provided", async () => {
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([mockMessage()]),
      };
      jest.spyOn(Message, "find").mockReturnValue(mockQuery as any);

      await messageService.findByConversation(VALID_CONV_ID, {
        after: "2024-01-01",
      });

      expect(Message.find).toHaveBeenCalledWith(
        expect.objectContaining({
          createdAt: expect.objectContaining({ $gt: expect.any(Date) }),
        }),
      );
    });
  });

  describe("update", () => {
    it("updates and returns message when sender matches", async () => {
      const msg = mockMessage({ content: "Old content" });
      msg.save = jest
        .fn()
        .mockResolvedValue({ ...msg, content: "Updated content" });

      (Message.findOne as jest.Mock).mockResolvedValue(msg);

      const result = await messageService.update(
        VALID_MSG_ID,
        { content: "Updated content" },
        VALID_USER_ID,
      );

      expect(Message.findOne).toHaveBeenCalledWith({
        _id: VALID_MSG_ID,
        sender: expect.any(Object),
      });
      expect(msg.save).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it("returns null when message not found", async () => {
      (Message.findOne as jest.Mock).mockResolvedValue(null);

      const result = await messageService.update(
        VALID_MSG_ID,
        { content: "Updated" },
        WRONG_USER_ID,
      );

      expect(result).toBeNull();
    });
  });

  describe("delete", () => {
    it("deletes message when found", async () => {
      (Message.findOneAndDelete as jest.Mock).mockResolvedValue(mockMessage());

      const result = await messageService.delete(VALID_MSG_ID, VALID_USER_ID);

      expect(Message.findOneAndDelete).toHaveBeenCalledWith({
        _id: VALID_MSG_ID,
        sender: expect.any(Object),
      });
      expect(result).toBe(true);
    });

    it("returns false when message not found", async () => {
      (Message.findOneAndDelete as jest.Mock).mockResolvedValue(null);

      const result = await messageService.delete(VALID_MSG_ID, WRONG_USER_ID);

      expect(result).toBe(false);
    });
  });

  describe("markAsRead", () => {
    it("adds user to readBy array", async () => {
      const msg = mockMessage();
      (Message.findByIdAndUpdate as jest.Mock).mockResolvedValue(msg);

      const result = await messageService.markAsRead(VALID_MSG_ID, VALID_USER_ID);

      expect(Message.findByIdAndUpdate).toHaveBeenCalledWith(
        VALID_MSG_ID,
        { $addToSet: { readBy: expect.any(Object) } },
        { new: true },
      );
      expect(result).toBeDefined();
    });
  });

  describe("markConversationAsRead", () => {
    it("marks all unread messages in conversation as read", async () => {
      (Message.updateMany as jest.Mock).mockResolvedValue({ modifiedCount: 5 });

      const result = await messageService.markConversationAsRead(
        VALID_CONV_ID,
        VALID_USER_ID,
      );

      expect(Message.updateMany).toHaveBeenCalledWith(
        {
          conversationId: expect.any(Object),
          readBy: { $ne: expect.any(Object) },
          sender: { $ne: expect.any(Object) },
        },
        { $addToSet: { readBy: expect.any(Object) } },
      );
      expect(result).toEqual({ modifiedCount: 5 });
    });
  });

  describe("getUnreadCount", () => {
    it("returns count of unread messages", async () => {
      (Message.countDocuments as jest.Mock).mockResolvedValue(10);

      const result = await messageService.getUnreadCount(
        VALID_CONV_ID,
        VALID_USER_ID,
      );

      expect(Message.countDocuments).toHaveBeenCalledWith({
        conversationId: expect.any(Object),
        readBy: { $ne: expect.any(Object) },
        sender: { $ne: expect.any(Object) },
      });
      expect(result).toBe(10);
    });
  });
});

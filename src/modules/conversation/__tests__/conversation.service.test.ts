import { conversationService } from "../conversation.service";
import { Conversation, IConversation } from "../../../models/Conversation";

jest.mock("../../../models/Conversation");

const VALID_CONV_ID = "69dca1f6252732585e52c128";
const VALID_USER_ID = "69d4f40cb96bfa6cbfc64adb";
const OTHER_USER_ID = "69d78b0198f6c2c2b9147688";

const mockConversation = (
  overrides: Partial<IConversation> = {},
): IConversation =>
  ({
    _id: { toString: () => VALID_CONV_ID },
    participants: [
      {
        _id: { toString: () => VALID_USER_ID },
        name: "User1",
        email: "user1@test.com",
      },
      {
        _id: { toString: () => OTHER_USER_ID },
        name: "User2",
        email: "user2@test.com",
      },
    ],
    lastMessage: { toString: () => "507f1f77bcf86cd799439014" },
    lastMessageAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    toObject: jest.fn().mockReturnThis(),
    ...overrides,
  }) as unknown as IConversation;

describe("conversationService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("create", () => {
    it("creates a new conversation with valid participants", async () => {
      const mockConv = mockConversation();
      (Conversation.findOne as jest.Mock).mockResolvedValue(null);
      (Conversation.create as jest.Mock).mockResolvedValue(mockConv);

      const result = await conversationService.create(
        { participants: [VALID_USER_ID, OTHER_USER_ID] },
        VALID_USER_ID,
      );

      expect(Conversation.create).toHaveBeenCalledWith({
        participants: expect.any(Array),
      });
      expect(result).toBeDefined();
    });

    it("returns existing conversation if one already exists", async () => {
      const existingConv = mockConversation();
      (Conversation.findOne as jest.Mock).mockResolvedValue(existingConv);

      const result = await conversationService.create(
        { participants: [VALID_USER_ID, OTHER_USER_ID] },
        VALID_USER_ID,
      );

      expect(Conversation.create).not.toHaveBeenCalled();
      expect(result).toBe(existingConv);
    });

    it("maps string participants to ObjectId", async () => {
      const mockConv = mockConversation();
      (Conversation.findOne as jest.Mock).mockResolvedValue(null);
      (Conversation.create as jest.Mock).mockResolvedValue(mockConv);

      await conversationService.create(
        { participants: [VALID_USER_ID, OTHER_USER_ID] },
        VALID_USER_ID,
      );

      const createCall = (Conversation.create as jest.Mock).mock.calls[0][0];
      expect(createCall.participants).toHaveLength(2);
    });
  });

  describe("getConversation", () => {
    it("returns conversation with populated participants", async () => {
      const mockConv = mockConversation();
      const mockPopulate = jest.fn().mockReturnValue({
        toObject: jest.fn().mockReturnValue(mockConv),
      });
      (Conversation.findById as jest.Mock).mockReturnValue({
        populate: mockPopulate,
      });

      const result = await conversationService.getConversation(VALID_CONV_ID);

      expect(Conversation.findById).toHaveBeenCalledWith(VALID_CONV_ID);
      expect(mockPopulate).toHaveBeenCalledWith("participants", "name email");
      expect(result).toBeDefined();
    });

    it("returns null when conversation not found", async () => {
      (Conversation.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockReturnValue({
          toObject: jest.fn().mockReturnValue(null),
        }),
      });

      const result = await conversationService.getConversation(VALID_CONV_ID);

      expect(result).toBeNull();
    });
  });

  describe("getUserConversations", () => {
    it("returns conversations for user sorted by lastMessageAt", async () => {
      const mockConv = mockConversation();
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue([mockConv]),
      };
      (Conversation.find as jest.Mock).mockReturnValue(mockQuery);

      const result =
        await conversationService.getUserConversations(VALID_USER_ID);

      expect(Conversation.find).toHaveBeenCalledWith({
        participants: VALID_USER_ID,
      });
      expect(result).toHaveLength(1);
    });

    it("populates participants and lastMessage", async () => {
      const mockConv = mockConversation();
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue([mockConv]),
      };
      (Conversation.find as jest.Mock).mockReturnValue(mockQuery);

      await conversationService.getUserConversations(VALID_USER_ID);

      expect(mockQuery.populate).toHaveBeenCalledWith(
        "participants",
        "name email",
      );
      expect(mockQuery.populate).toHaveBeenCalledWith("lastMessage");
    });

    it("sorts by lastMessageAt descending then updatedAt descending", async () => {
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue([]),
      };
      (Conversation.find as jest.Mock).mockReturnValue(mockQuery);

      await conversationService.getUserConversations(VALID_USER_ID);

      expect(mockQuery.sort).toHaveBeenCalledWith({
        lastMessageAt: -1,
        updatedAt: -1,
      });
    });

    it("returns empty array when user has no conversations", async () => {
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue([]),
      };
      (Conversation.find as jest.Mock).mockReturnValue(mockQuery);

      const result =
        await conversationService.getUserConversations(VALID_USER_ID);

      expect(result).toEqual([]);
    });
  });
});

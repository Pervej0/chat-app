import {
  getHello,
  createHello,
  updateHello,
  deleteHello,
} from "../hello.controller";
import { helloService } from "../hello.service";

jest.mock("../hello.service");

const VALID_ID = "507f1f77bcf86cd799439013";
const VALID_USER_ID = "507f1f77bcf86cd799439012";

const mockReq = (overrides: Record<string, any> = {}): any => ({
  user: { userId: VALID_USER_ID, email: "test@example.com", role: "user" },
  body: {},
  params: {},
  ...overrides,
});

const mockRes = (): any => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe("helloController", () => {
  let req: any;
  let res: any;
  let next: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    req = mockReq();
    res = mockRes();
    next = jest.fn();
  });

  describe("getHello", () => {
    it("returns 401 when user is missing", async () => {
      req.user = undefined;
      await getHello(req, res, next);
      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 401 }),
      );
    });

    it("returns 404 when hello not found", async () => {
      req.params.id = VALID_ID;
      (helloService.findById as jest.Mock).mockResolvedValue(null);
      await getHello(req, res, next);
      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 404 }),
      );
    });

    it("returns 200 with hello data on success", async () => {
      req.params.id = VALID_ID;
      const mockHello = { _id: VALID_ID, message: "Hello world" };
      (helloService.findById as jest.Mock).mockResolvedValue(mockHello);
      await getHello(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, data: mockHello }),
      );
    });
  });

  describe("createHello", () => {
    it("returns 401 when user is missing", async () => {
      req.user = undefined;
      await createHello(req, res, next);
      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 401 }),
      );
    });

    it("returns 400 when message is missing", async () => {
      req.body = {};
      await createHello(req, res, next);
      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 400 }),
      );
    });

    it("returns 201 on success", async () => {
      req.body = { message: "Hello" };
      const mockHello = { _id: VALID_ID, message: "Hello" };
      (helloService.create as jest.Mock).mockResolvedValue(mockHello);
      await createHello(req, res, next);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: "Hello created successfully",
        }),
      );
    });
  });

  describe("updateHello", () => {
    it("returns 401 when user is missing", async () => {
      req.user = undefined;
      await updateHello(req, res, next);
      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 401 }),
      );
    });

    it("returns 400 when message is missing", async () => {
      req.params.id = VALID_ID;
      req.body = {};
      await updateHello(req, res, next);
      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 400 }),
      );
    });

    it("returns 404 when hello not found or unauthorized", async () => {
      req.params.id = VALID_ID;
      req.body = { message: "Updated" };
      (helloService.update as jest.Mock).mockResolvedValue(null);
      await updateHello(req, res, next);
      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 404 }),
      );
    });

    it("returns 200 on success", async () => {
      req.params.id = VALID_ID;
      req.body = { message: "Updated" };
      const mockHello = { _id: VALID_ID, message: "Updated" };
      (helloService.update as jest.Mock).mockResolvedValue(mockHello);
      await updateHello(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: "Hello updated successfully",
        }),
      );
    });
  });

  describe("deleteHello", () => {
    it("returns 401 when user is missing", async () => {
      req.user = undefined;
      await deleteHello(req, res, next);
      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 401 }),
      );
    });

    it("returns 404 when hello not found or unauthorized", async () => {
      req.params.id = VALID_ID;
      (helloService.delete as jest.Mock).mockResolvedValue(false);
      await deleteHello(req, res, next);
      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 404 }),
      );
    });

    it("returns 200 on success", async () => {
      req.params.id = VALID_ID;
      (helloService.delete as jest.Mock).mockResolvedValue(true);
      await deleteHello(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: "Hello deleted successfully",
        }),
      );
    });
  });
});
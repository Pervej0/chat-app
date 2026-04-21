import { Router } from "express";
import {
  getHello,
  createHello,
  updateHello,
  deleteHello,
} from "./hello.controller";
import { authMiddleware } from "../../middleware/auth";

const router = Router();

router.use(authMiddleware);

router.get("/:id", getHello);
router.post("/", createHello);
router.put("/:id", updateHello);
router.delete("/:id", deleteHello);

export default router;
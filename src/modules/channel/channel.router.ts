import { Router } from "express";
import { ChannelController } from "./channel.controller";
import { authMiddleware } from "../../middleware/auth";

const router = Router();
const channelController = new ChannelController();

router.use(authMiddleware);

router.post("/", channelController.createChannel);
// Uses workspaceId in params to fetch channels for that workspace
router.get("/workspace/:workspaceId", channelController.getChannels);
router.post("/:id/join", channelController.joinChannel);

export default router;

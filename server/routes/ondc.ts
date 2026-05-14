import { Router, type Request, type Response } from "express";

const router = Router();

const sendAck = (req: Request, res: Response) => {
  const body = req.body as { context?: unknown } | undefined;
  const payload: Record<string, unknown> = {
    message: { ack: { status: "ACK" } },
  };
  if (body?.context) {
    payload.context = body.context;
  }
  res.json(payload);
};

router.post("/search", sendAck);
router.post("/select", sendAck);
router.post("/init", sendAck);
router.post("/confirm", sendAck);
router.post("/status", sendAck);
router.post("/track", sendAck);
router.post("/cancel", sendAck);
router.post("/update", sendAck);
router.post("/rating", sendAck);
router.post("/support", sendAck);
router.post("/on_search", sendAck);
router.post("/on_select", sendAck);
router.post("/on_init", sendAck);
router.post("/on_confirm", sendAck);
router.post("/on_status", sendAck);
router.post("/on_track", sendAck);
router.post("/on_cancel", sendAck);
router.post("/on_update", sendAck);
router.post("/on_rating", sendAck);
router.post("/on_support", sendAck);

export default router;

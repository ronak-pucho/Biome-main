import { Router, type Request, type Response } from "express";
import { z } from "zod";
import { FriendModel } from "../models/Friend";

const router = Router();

const FriendSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  phone: z.string().trim().optional(),
  email: z.string().trim().email("Invalid email").optional().or(z.literal("")),
});

const FriendUpdateSchema = FriendSchema.partial();

// POST /api/friends - Create a new friend
router.post("/", async (req: Request, res: Response) => {
  try {
    const userId = req.ctx!.userId!;
    const parsed = FriendSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "INVALID_BODY", details: parsed.error.flatten() });
      return;
    }

    const friend = new FriendModel({ ...parsed.data, userId });
    await friend.save();
    
    res.status(201).json(friend);
  } catch (error) {
    console.error("Create Friend Error:", error);
    res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
  }
});

// GET /api/friends - Retrieve all friends for the user
router.get("/", async (req: Request, res: Response) => {
  try {
    const userId = req.ctx!.userId!;
    const friends = await FriendModel.find({ userId }).sort({ createdAt: -1 });
    res.json(friends);
  } catch (error) {
    console.error("Get Friends Error:", error);
    res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
  }
});

// PUT /api/friends/:id - Update an existing friend
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const userId = req.ctx!.userId!;
    const { id } = req.params;
    
    const parsed = FriendUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "INVALID_BODY", details: parsed.error.flatten() });
      return;
    }

    const updatedFriend = await FriendModel.findOneAndUpdate(
      { _id: id, userId },
      { $set: parsed.data },
      { new: true }
    );

    if (!updatedFriend) {
      res.status(404).json({ error: "FRIEND_NOT_FOUND" });
      return;
    }

    res.json(updatedFriend);
  } catch (error) {
    console.error("Update Friend Error:", error);
    res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
  }
});

// DELETE /api/friends/:id - Delete a friend
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const userId = req.ctx!.userId!;
    const { id } = req.params;

    const deletedFriend = await FriendModel.findOneAndDelete({ _id: id, userId });
    if (!deletedFriend) {
      res.status(404).json({ error: "FRIEND_NOT_FOUND" });
      return;
    }

    // Optionally: Unlink expenses or delete them
    // For now, we will just delete the friend. Handling expense unlinking can be done later if needed.

    res.json({ success: true, message: "Friend deleted" });
  } catch (error) {
    console.error("Delete Friend Error:", error);
    res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
  }
});

export default router;

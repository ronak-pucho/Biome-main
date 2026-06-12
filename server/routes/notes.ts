import { Router, type Request, type Response } from "express";
import { z } from "zod";
import { NoteModel } from "../models/Note";

const router = Router();

const NoteSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  content: z.string().trim().optional().default(""),
});

const NoteUpdateSchema = NoteSchema.partial();

// POST /api/notes — Create a new note
router.post("/", async (req: Request, res: Response) => {
  try {
    const userId = req.ctx!.userId!;
    const parsed = NoteSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "INVALID_BODY", details: parsed.error.flatten() });
      return;
    }

    const note = new NoteModel({ ...parsed.data, userId });
    await note.save();

    res.status(201).json({ success: true, note });
  } catch (error) {
    console.error("Create Note Error:", error);
    res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
  }
});

// GET /api/notes — Get all notes for logged-in user
router.get("/", async (req: Request, res: Response) => {
  try {
    const userId = req.ctx!.userId!;
    const notes = await NoteModel.find({ userId }).sort({ updatedAt: -1 });
    res.json({ success: true, notes });
  } catch (error) {
    console.error("Get Notes Error:", error);
    res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
  }
});

// PUT /api/notes/:id — Update a note
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const userId = req.ctx!.userId!;
    const { id } = req.params;

    const parsed = NoteUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "INVALID_BODY", details: parsed.error.flatten() });
      return;
    }

    const updatedNote = await NoteModel.findOneAndUpdate(
      { _id: id, userId },
      { $set: parsed.data },
      { new: true }
    );

    if (!updatedNote) {
      res.status(404).json({ error: "NOTE_NOT_FOUND" });
      return;
    }

    res.json({ success: true, note: updatedNote });
  } catch (error) {
    console.error("Update Note Error:", error);
    res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
  }
});

// DELETE /api/notes/:id — Delete a note
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const userId = req.ctx!.userId!;
    const { id } = req.params;

    const deletedNote = await NoteModel.findOneAndDelete({ _id: id, userId });
    if (!deletedNote) {
      res.status(404).json({ error: "NOTE_NOT_FOUND" });
      return;
    }

    res.json({ success: true, message: "Note deleted" });
  } catch (error) {
    console.error("Delete Note Error:", error);
    res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
  }
});

export default router;

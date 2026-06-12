import mongoose from "mongoose";

const NoteSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    content: { type: String, default: "", trim: true },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserData",
      required: true,
    },
  },
  {
    timestamps: true,
    collection: "notes",
  }
);

export const NoteModel = mongoose.model("Note", NoteSchema);

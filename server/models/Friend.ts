import mongoose from "mongoose";

const FriendSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  phone: { type: String, default: "", trim: true },
  email: { type: String, default: "", trim: true },
  userId: { type: String, required: true, index: true } // Associate with a specific user
}, {
  timestamps: true,
  collection: "friends"
});

export const FriendModel = mongoose.model("Friend", FriendSchema);

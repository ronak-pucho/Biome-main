import mongoose from "mongoose";

const ExpenseSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  amount: { type: Number, required: true },
  date: { type: Date, required: true },
  type: { type: String, enum: ["send", "receive"], default: "send" },
  friendId: { type: mongoose.Schema.Types.ObjectId, ref: "Friend", default: null, index: true },
  notes: { type: String, default: "", trim: true },
  paymentMethod: { type: String, default: "", trim: true },
  isDisabled: { type: Boolean, default: false },
  userId: { type: String, required: true, index: true } // Associate with a specific user
}, {
  timestamps: true,
  collection: "expenses"
});

export const ExpenseModel = mongoose.model("Expense", ExpenseSchema);

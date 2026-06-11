import { Router, type Request, type Response } from "express";
import { z } from "zod";
import { ExpenseModel } from "../models/Expense";
import mongoose from "mongoose";

const router = Router();

const ExpenseSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  amount: z.number().min(0, "Amount cannot be negative"),
  date: z.string().datetime({ message: "Invalid date format. Must be ISO8601" }),
  type: z.enum(["send", "receive"]),
  friendId: z.string().nullable().optional(),
  notes: z.string().trim().optional(),
  paymentMethod: z.string().trim().optional(),
  isDisabled: z.boolean().optional(),
});

const ExpenseUpdateSchema = ExpenseSchema.partial();

// POST /api/expenses - Create a new expense
router.post("/", async (req: Request, res: Response) => {
  try {
    const userId = req.ctx!.userId!;
    const parsed = ExpenseSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "INVALID_BODY", details: parsed.error.flatten() });
      return;
    }

    const expenseData = { ...parsed.data, userId };
    
    // Ensure friendId is a valid ObjectId if provided
    if (expenseData.friendId) {
      if (!mongoose.Types.ObjectId.isValid(expenseData.friendId)) {
        res.status(400).json({ error: "INVALID_FRIEND_ID" });
        return;
      }
    } else {
      expenseData.friendId = null as any;
    }

    const expense = new ExpenseModel(expenseData);
    await expense.save();
    
    res.status(201).json(expense);
  } catch (error) {
    console.error("Create Expense Error:", error);
    res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
  }
});

// GET /api/expenses - Retrieve all expenses for the user (with optional filters)
router.get("/", async (req: Request, res: Response) => {
  try {
    const userId = req.ctx!.userId!;
    const { friendId, isDaily } = req.query;

    const query: any = { userId };

    if (friendId) {
      if (mongoose.Types.ObjectId.isValid(friendId as string)) {
        query.friendId = friendId;
      } else {
        res.status(400).json({ error: "INVALID_FRIEND_ID" });
        return;
      }
    } else if (isDaily === "true") {
      query.friendId = null;
    }

    const expenses = await ExpenseModel.find(query).sort({ date: -1 });
    res.json(expenses);
  } catch (error) {
    console.error("Get Expenses Error:", error);
    res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
  }
});

// PUT /api/expenses/:id - Update an existing expense
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const userId = req.ctx!.userId!;
    const { id } = req.params;
    
    const parsed = ExpenseUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "INVALID_BODY", details: parsed.error.flatten() });
      return;
    }

    const updateData: any = { ...parsed.data };
    if (updateData.friendId !== undefined) {
      if (updateData.friendId && !mongoose.Types.ObjectId.isValid(updateData.friendId)) {
        res.status(400).json({ error: "INVALID_FRIEND_ID" });
        return;
      }
      if (!updateData.friendId) updateData.friendId = null;
    }

    const updatedExpense = await ExpenseModel.findOneAndUpdate(
      { _id: id, userId },
      { $set: updateData },
      { new: true }
    );

    if (!updatedExpense) {
      res.status(404).json({ error: "EXPENSE_NOT_FOUND" });
      return;
    }

    res.json(updatedExpense);
  } catch (error) {
    console.error("Update Expense Error:", error);
    res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
  }
});

// DELETE /api/expenses/:id - Delete an expense
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const userId = req.ctx!.userId!;
    const { id } = req.params;

    const deletedExpense = await ExpenseModel.findOneAndDelete({ _id: id, userId });
    if (!deletedExpense) {
      res.status(404).json({ error: "EXPENSE_NOT_FOUND" });
      return;
    }

    res.json({ success: true, message: "Expense deleted" });
  } catch (error) {
    console.error("Delete Expense Error:", error);
    res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
  }
});

export default router;

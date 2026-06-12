import { Router, type Request, type Response } from "express";
import jwt from "jsonwebtoken";
import { UserDataModel } from "../models/UserData";
import { ExpenseModel } from "../models/Expense";
import { NoteModel } from "../models/Note";
import { FriendModel } from "../models/Friend";

const ADMIN_EMAIL = "admin@gmail.com";
const ADMIN_PASSWORD = "Admin@123";

const router = Router();

function signAdminToken(email: string) {
  const secret = process.env.JWT_SECRET || "dev_jwt_secret_change_me";
  return jwt.sign({ email, role: "admin" }, secret, { algorithm: "HS256", expiresIn: "8h" });
}

function verifyAdminToken(token: string): boolean {
  try {
    const secret = process.env.JWT_SECRET || "dev_jwt_secret_change_me";
    const decoded = jwt.verify(token, secret) as any;
    return decoded?.role === "admin";
  } catch {
    return false;
  }
}

function adminRequired(req: Request, res: Response, next: () => void) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "UNAUTHORIZED" });
    return;
  }
  const token = authHeader.slice(7);
  if (!verifyAdminToken(token)) {
    res.status(403).json({ error: "FORBIDDEN" });
    return;
  }
  next();
}

const guard = (req: Request, res: Response, next: () => void) => adminRequired(req, res, next);

// POST /api/admin/login
router.post("/login", async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: "INVALID_BODY" });
    return;
  }
  const normalizedEmail = String(email).trim().toLowerCase();
  if (normalizedEmail !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
    res.status(401).json({ error: "INVALID_CREDENTIALS", message: "Invalid admin credentials" });
    return;
  }
  const token = signAdminToken(ADMIN_EMAIL);
  res.json({ success: true, token, admin: { email: ADMIN_EMAIL, role: "admin" } });
});

// GET /api/admin/stats — Dashboard overview counts + chart data
router.get("/stats", guard, async (req: Request, res: Response) => {
  try {
    const [userCount, expenseCount, noteCount, friendCount] = await Promise.all([
      UserDataModel.countDocuments(),
      ExpenseModel.countDocuments(),
      NoteModel.countDocuments(),
      FriendModel.countDocuments(),
    ]);

    const expenseAgg = await ExpenseModel.aggregate([
      { $group: { _id: "$type", total: { $sum: "$amount" }, count: { $sum: 1 } } },
    ]);
    const sendTotal = expenseAgg.find((e: any) => e._id === "send")?.total ?? 0;
    const receiveTotal = expenseAgg.find((e: any) => e._id === "receive")?.total ?? 0;
    const sendCount = expenseAgg.find((e: any) => e._id === "send")?.count ?? 0;
    const receiveCount = expenseAgg.find((e: any) => e._id === "receive")?.count ?? 0;

    // New users in last 7 days
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const newUsersThisWeek = await UserDataModel.countDocuments({ createdAt: { $gte: weekAgo } });

    // Monthly expenses for last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const monthlyExpenses = await ExpenseModel.aggregate([
      { $match: { date: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: {
            year: { $year: "$date" },
            month: { $month: "$date" },
            type: "$type",
          },
          total: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    // Monthly user registrations for last 6 months
    const monthlyUsers = await UserDataModel.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    // Build unified month labels for last 6 months
    const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const chartMonths: { month: string; sent: number; received: number; users: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const y = d.getFullYear();
      const m = d.getMonth() + 1;
      const label = `${monthNames[m - 1]} ${y}`;
      const sentEntry = monthlyExpenses.find((e: any) => e._id.year === y && e._id.month === m && e._id.type === "send");
      const recvEntry = monthlyExpenses.find((e: any) => e._id.year === y && e._id.month === m && e._id.type === "receive");
      const userEntry = monthlyUsers.find((u: any) => u._id.year === y && u._id.month === m);
      chartMonths.push({ month: label, sent: sentEntry?.total ?? 0, received: recvEntry?.total ?? 0, users: userEntry?.count ?? 0 });
    }

    // Payment method breakdown
    const paymentMethods = await ExpenseModel.aggregate([
      { $match: { paymentMethod: { $nin: [null, ""] } } },
      { $group: { _id: "$paymentMethod", value: { $sum: 1 } } },
      { $sort: { value: -1 } },
      { $limit: 6 },
    ]);

    res.json({
      success: true,
      stats: {
        userCount, expenseCount, noteCount, friendCount,
        sendTotal, receiveTotal, sendCount, receiveCount,
        newUsersThisWeek,
        chartMonths,
        paymentMethods: paymentMethods.map((p: any) => ({ name: p._id || "Other", value: p.value })),
      },
    });
  } catch (error) {
    console.error("Admin Stats Error:", error);
    res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
  }
});

// GET /api/admin/users
router.get("/users", guard, async (req: Request, res: Response) => {
  try {
    const users = await UserDataModel.find({}, { passwordHash: 0, resetOtp: 0, resetOtpExpiry: 0 }).sort({ createdAt: -1 });

    // Attach expense + note counts per user
    const userIds = users.map((u: any) => String(u._id));
    const [expCounts, noteCounts, friendCounts] = await Promise.all([
      ExpenseModel.aggregate([{ $match: { userId: { $in: userIds } } }, { $group: { _id: "$userId", count: { $sum: 1 }, total: { $sum: "$amount" } } }]),
      NoteModel.aggregate([{ $match: { userId: { $in: userIds } } }, { $group: { _id: "$userId", count: { $sum: 1 } } }]),
      FriendModel.aggregate([{ $match: { userId: { $in: userIds } } }, { $group: { _id: "$userId", count: { $sum: 1 } } }]),
    ]);

    const expMap = Object.fromEntries(expCounts.map((e: any) => [String(e._id), { count: e.count, total: e.total }]));
    const noteMap = Object.fromEntries(noteCounts.map((n: any) => [String(n._id), n.count]));
    const friendMap = Object.fromEntries(friendCounts.map((f: any) => [String(f._id), f.count]));

    const enriched = users.map((u: any) => {
      const uid = String(u._id);
      return {
        ...u.toObject(),
        expenseCount: expMap[uid]?.count ?? 0,
        expenseTotal: expMap[uid]?.total ?? 0,
        noteCount: noteMap[uid] ?? 0,
        friendCount: friendMap[uid] ?? 0,
      };
    });

    res.json({ success: true, users: enriched });
  } catch (error) {
    console.error("Admin Get Users Error:", error);
    res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
  }
});

// DELETE /api/admin/users/:id
router.delete("/users/:id", guard, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await UserDataModel.findByIdAndDelete(id);
    await ExpenseModel.deleteMany({ userId: id });
    await NoteModel.deleteMany({ userId: id });
    await FriendModel.deleteMany({ userId: id });
    res.json({ success: true, message: "User and all their data deleted" });
  } catch (error) {
    console.error("Admin Delete User Error:", error);
    res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
  }
});

// GET /api/admin/users/:id/expenses — Expenses for a specific user
router.get("/users/:id/expenses", guard, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const expenses = await ExpenseModel.find({ userId: id }).sort({ date: -1 });
    res.json({ success: true, expenses });
  } catch (error) {
    res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
  }
});

// GET /api/admin/users/:id/notes — Notes for a specific user
router.get("/users/:id/notes", guard, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const notes = await NoteModel.find({ userId: id }).sort({ updatedAt: -1 });
    res.json({ success: true, notes });
  } catch (error) {
    res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
  }
});

// GET /api/admin/users/:id/friends — Friends for a specific user
router.get("/users/:id/friends", guard, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const friends = await FriendModel.find({ userId: id }).sort({ createdAt: -1 });
    res.json({ success: true, friends });
  } catch (error) {
    res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
  }
});

// DELETE /api/admin/friends/:id
router.delete("/friends/:id", guard, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await FriendModel.findByIdAndDelete(id);
    res.json({ success: true, message: "Friend deleted" });
  } catch (error) {
    console.error("Admin Delete Friend Error:", error);
    res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
  }
});

// GET /api/admin/expenses
router.get("/expenses", guard, async (req: Request, res: Response) => {
  try {
    const expenses = await ExpenseModel.find({}).sort({ date: -1 }).lean();
    const userIds = [...new Set(expenses.map((e: any) => String(e.userId)))];
    const users = await UserDataModel.find({ _id: { $in: userIds } }, { firstName: 1, lastName: 1, email: 1 }).lean();
    const userMap = Object.fromEntries(users.map((u: any) => [String(u._id), u]));
    const enriched = expenses.map((e: any) => ({ ...e, user: userMap[String(e.userId)] || null }));
    res.json({ success: true, expenses: enriched });
  } catch (error) {
    console.error("Admin Get Expenses Error:", error);
    res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
  }
});

// DELETE /api/admin/expenses/:id
router.delete("/expenses/:id", guard, async (req: Request, res: Response) => {
  try {
    await ExpenseModel.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Expense deleted" });
  } catch (error) {
    res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
  }
});

// GET /api/admin/notes
router.get("/notes", guard, async (req: Request, res: Response) => {
  try {
    const notes = await NoteModel.find({}).sort({ updatedAt: -1 }).lean();
    const userIds = [...new Set(notes.map((n: any) => String(n.userId)))];
    const users = await UserDataModel.find({ _id: { $in: userIds } }, { firstName: 1, lastName: 1, email: 1 }).lean();
    const userMap = Object.fromEntries(users.map((u: any) => [String(u._id), u]));
    const enriched = notes.map((n: any) => ({ ...n, user: userMap[String(n.userId)] || null }));
    res.json({ success: true, notes: enriched });
  } catch (error) {
    console.error("Admin Get Notes Error:", error);
    res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
  }
});

// DELETE /api/admin/notes/:id
router.delete("/notes/:id", guard, async (req: Request, res: Response) => {
  try {
    await NoteModel.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Note deleted" });
  } catch (error) {
    res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
  }
});

export default router;

import { Router, type Request, type Response } from "express";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { UserDataModel } from "../models/UserData";

const router = Router();

const UsersDataRegistrationSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required"),
  lastName: z.string().trim().min(1, "Last name is required"),
  email: z.string().trim().toLowerCase().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  device_id: z.string().optional(),
  version_name: z.string().optional(),
  version_code: z.union([z.string(), z.number()]).optional(),
});

router.post("/register", async (req: Request, res: Response) => {
  const parsed = UsersDataRegistrationSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "INVALID_BODY", details: parsed.error.flatten() });
    return;
  }

  const { firstName, lastName, email, password, device_id, version_name, version_code } = parsed.data;

  try {
    // Check if user already exists
    const existingUser = await UserDataModel.findOne({ email });
    if (existingUser) {
      res.status(409).json({ error: "EMAIL_ALREADY_EXISTS" });
      return;
    }

    // Hash the password
    const passwordHash = await bcrypt.hash(password, 12);

    // Save user to the database
    const newUser = new UserDataModel({
      firstName,
      lastName,
      email,
      passwordHash,
      device_id,
      version_name,
      version_code: String(version_code),
    });

    await newUser.save();

    // Remove sensitive data from response
    const { passwordHash: _, ...userResponse } = newUser.toObject();

    res.status(201).json({ success: true, user: userResponse });
  } catch (error) {
    console.error("Registration Error:", error);
    res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
  }
});

export default router;

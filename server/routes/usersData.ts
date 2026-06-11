import { Router, type Request, type Response } from "express";
import { z } from "zod";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { UserDataModel } from "../models/UserData";
import { authRequired } from "../middleware/auth";

function signToken(payload: { id: string; email: string }) {
  const secret = process.env.JWT_SECRET || "dev_jwt_secret_change_me";
  return jwt.sign(payload, secret, { algorithm: "HS256", expiresIn: "7d" });
}

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
    
    // Generate token
    const token = signToken({ id: String(newUser._id), email: newUser.email });

    res.status(201).json({ success: true, user: userResponse, token });
  } catch (error) {
    console.error("Registration Error:", error);
    res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
  }
});

const UsersDataLoginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

router.post("/login", async (req: Request, res: Response) => {
  const parsed = UsersDataLoginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "INVALID_BODY", details: parsed.error.flatten() });
    return;
  }

  const { email, password } = parsed.data;

  try {
    // Find the user by email
    const user = await UserDataModel.findOne({ email });
    if (!user) {
      res.status(401).json({ error: "INVALID_CREDENTIALS" });
      return;
    }

    // Compare passwords
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      res.status(401).json({ error: "INVALID_CREDENTIALS" });
      return;
    }

    // Remove sensitive data from response
    const { passwordHash: _, ...userResponse } = user.toObject();
    
    // Generate token
    const token = signToken({ id: String(user._id), email: user.email });

    res.json({ success: true, user: userResponse, token });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
  }
});

router.get("/me", authRequired(), async (req: Request, res: Response) => {
  try {
    const userId = req.ctx?.userId;
    const user = await UserDataModel.findById(userId);
    if (!user) {
      res.status(404).json({ error: "USER_NOT_FOUND" });
      return;
    }
    
    // Remove sensitive data
    const { passwordHash: _, ...userResponse } = user.toObject();
    res.json({ success: true, user: userResponse });
  } catch (error) {
    console.error("Get Me Error:", error);
    res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
  }
});

import nodemailer from "nodemailer";

// --- FORGOT PASSWORD APIs ---

// Configure Nodemailer transporter (reads from .env)
const getTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

const ForgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email("Invalid email address"),
});

router.post("/forgot-password", async (req: Request, res: Response) => {
  try {
    const parsed = ForgotPasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "INVALID_BODY", details: parsed.error.flatten() });
      return;
    }

    const { email } = parsed.data;
    const user = await UserDataModel.findOne({ email });
    
    if (!user) {
      // Don't leak whether the email exists or not
      res.json({ success: true, message: "If an account with that email exists, we sent an OTP." });
      return;
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 15 * 60 * 1000); // 15 mins from now

    user.resetOtp = otp;
    user.resetOtpExpiry = expiry;
    await user.save();

    // Send email
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      const transporter = getTransporter();
      await transporter.sendMail({
        from: `"Notes App Support" <${process.env.SMTP_USER}>`,
        to: user.email,
        subject: "Your Password Reset OTP",
        text: `Your OTP for resetting your password is: ${otp}\nThis OTP will expire in 15 minutes.`,
        html: `<h3>Password Reset</h3><p>Your OTP for resetting your password is: <strong>${otp}</strong></p><p>This OTP will expire in 15 minutes.</p>`,
      });
      console.log(`OTP sent to ${email}`);
    } else {
      // For testing when email is not configured
      console.warn(`[WARNING] Email not configured. OTP for ${email} is: ${otp}`);
    }

    res.json({ success: true, message: "OTP sent to your email." });
  } catch (error) {
    console.error("Forgot Password Error:", error);
    res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
  }
});

const VerifyOtpSchema = z.object({
  email: z.string().trim().toLowerCase().email("Invalid email address"),
  otp: z.string().trim().min(6, "OTP must be at least 6 digits"),
});

router.post("/verify-otp", async (req: Request, res: Response) => {
  try {
    const parsed = VerifyOtpSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "INVALID_BODY", details: parsed.error.flatten() });
      return;
    }

    const { email, otp } = parsed.data;
    const user = await UserDataModel.findOne({ email });

    if (!user || user.resetOtp !== otp) {
      res.status(400).json({ error: "INVALID_OTP" });
      return;
    }

    if (!user.resetOtpExpiry || user.resetOtpExpiry < new Date()) {
      res.status(400).json({ error: "OTP_EXPIRED" });
      return;
    }

    res.json({ success: true, message: "OTP verified. You can now reset your password." });
  } catch (error) {
    console.error("Verify OTP Error:", error);
    res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
  }
});

const ResetPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email("Invalid email address"),
  otp: z.string().trim().min(6, "OTP must be at least 6 digits"),
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
});

router.post("/reset-password", async (req: Request, res: Response) => {
  try {
    const parsed = ResetPasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "INVALID_BODY", details: parsed.error.flatten() });
      return;
    }

    const { email, otp, newPassword } = parsed.data;
    const user = await UserDataModel.findOne({ email });

    if (!user || user.resetOtp !== otp) {
      res.status(400).json({ error: "INVALID_OTP" });
      return;
    }

    if (!user.resetOtpExpiry || user.resetOtpExpiry < new Date()) {
      res.status(400).json({ error: "OTP_EXPIRED" });
      return;
    }

    // Hash new password and clear OTP
    const passwordHash = await bcrypt.hash(newPassword, 12);
    user.passwordHash = passwordHash;
    user.resetOtp = null as any;
    user.resetOtpExpiry = null as any;
    await user.save();

    res.json({ success: true, message: "Password has been successfully reset." });
  } catch (error) {
    console.error("Reset Password Error:", error);
    res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
  }
});

export default router;

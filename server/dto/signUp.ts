import { z } from "zod";

export const SignUpSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  mobile_number: z
    .string()
    .trim()
    .min(8, "Mobile number must be at least 8 digits")
    .max(20, "Mobile number too long"),
  email: z.string().trim().toLowerCase().email("Invalid email address"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .max(128, "Password too long"),
  dob: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date of birth must be in YYYY-MM-DD format")
    .optional(),
  location: z.string().trim().min(1).optional(),
  device_id: z.string().trim().min(1).optional(),
  version_code: z.union([z.string(), z.number()]).optional(),
  version_name: z.string().trim().optional(),
  profile_pic: z.string().url("Profile picture must be a valid URL").optional(),
  device_type: z.enum(["android", "ios", "web", "other"]).optional(),
});

export type SignUpDto = z.infer<typeof SignUpSchema>;

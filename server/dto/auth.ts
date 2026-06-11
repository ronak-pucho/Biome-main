import { z } from "zod";

export const EmailLoginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  name: z.string().trim().min(1).optional(),
});

export type EmailLoginDto = z.infer<typeof EmailLoginSchema>;


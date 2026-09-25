import { z } from "zod";

const currentPassword = z.string().min(1, "Password is required");

// Mirrors the backend Identity password options (length 8, upper, lower, digit).
const newPassword = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain an uppercase letter")
  .regex(/[a-z]/, "Password must contain a lowercase letter")
  .regex(/[0-9]/, "Password must contain a digit");

export const usernameSchema = z.object({
  newUsername: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(32, "Username must be at most 32 characters"),
  password: currentPassword,
});

export type UsernameFormValues = z.infer<typeof usernameSchema>;

export const emailSchema = z.object({
  newEmail: z.email("Enter a valid email address"),
  password: currentPassword,
});

export type EmailFormValues = z.infer<typeof emailSchema>;

export const passwordSchema = z
  .object({
    oldPassword: currentPassword,
    newPassword,
    confirmPassword: z.string(),
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export type PasswordFormValues = z.infer<typeof passwordSchema>;

export const PFP_MAX_BYTES = 5 * 1024 * 1024;
export const PFP_ACCEPT = "image/jpeg,image/png,image/webp";

export const pfpSchema = z.object({
  picture: z
    .instanceof(File, { message: "Choose an image" })
    .refine((f) => PFP_ACCEPT.split(",").includes(f.type), "Use a JPEG, PNG or WebP image")
    .refine((f) => f.size <= PFP_MAX_BYTES, "Image must be 5 MB or smaller"),
  password: currentPassword,
});

export type PfpFormValues = z.infer<typeof pfpSchema>;

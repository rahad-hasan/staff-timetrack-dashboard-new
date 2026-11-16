import { z } from "zod";

/*
 * The schemas of the forms a visitor sees first: sign-in, forgot / reset
 * password, and Change password in settings.
 *
 * Kept out of ./schema, which builds every other form's schema (some thirty
 * `z.object` trees) as soon as anything is imported from it: these pages load
 * before anything else in the app and should construct only what they
 * validate. Do not re-export these from ./schema — that would pull the whole
 * file back into the sign-in bundle.
 */

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(6, {
      message: "Password must be at least 6 characters long",
    })
    .max(100, {
      message: "Password cannot exceed 100 characters",
    }),
});

export const forgetPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const createNewPasswordSchema = z
  .object({
    password: z
      .string()
      .min(6, {
        message: "Password must be at least 6 characters long",
      })
      .max(100, {
        message: "Password cannot exceed 100 characters",
      }),
    confirmPassword: z
      .string()
      .min(6, {
        message: "Password must be at least 6 characters long",
      })
      .max(100, {
        message: "Password cannot exceed 100 characters",
      }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Confirm passwords do not match",
    path: ["confirmPassword"],
  });

export const changePasswordSchema = z.object({
  oldPassword: z
    .string()
    .min(8, "Minimum 8 characters")
    .regex(/[a-z]/, "At least one lowercase letter")
    .regex(/[A-Z]/, "At least one uppercase letter")
    .regex(/\d/, "At least one number")
    .regex(/[!@#$%^&*(),.?":{}|<>]/, "At least one special character"),
  newPassword: z
    .string()
    .min(8, "Minimum 8 characters")
    .regex(/[a-z]/, "At least one lowercase letter")
    .regex(/[A-Z]/, "At least one uppercase letter")
    .regex(/\d/, "At least one number")
    .regex(/[!@#$%^&*(),.?":{}|<>]/, "At least one special character"),
});

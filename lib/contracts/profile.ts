import { z } from "zod";
import { ValidationError } from "@/lib/domain/errors";

export const updateProfileSchema = z.object({
  fullName: z.string().trim().min(2, "Full name is required.").optional(),
  phoneNumber: z.string().trim().max(30).optional().or(z.literal("")),
  currentAddress: z.string().trim().max(2000).optional().or(z.literal("")),
  permanentSameAsCurrent: z.union([z.literal("on"), z.literal("true"), z.literal("1")]).optional(),
  permanentAddress: z.string().trim().max(2000).optional().or(z.literal("")),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(6, "Current password is required."),
    newPassword: z.string().min(8, "New password must be at least 8 characters."),
    confirmPassword: z.string().min(8, "Please confirm the new password."),
  })
  .refine((value) => value.newPassword === value.confirmPassword, {
    message: "New password and confirm password must match.",
    path: ["confirmPassword"],
  });

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

export function parseUpdateProfileFormData(formData: FormData): UpdateProfileInput {
  const parsed = updateProfileSchema.safeParse({
    fullName: formData.get("fullName") || undefined,
    phoneNumber: formData.get("phoneNumber"),
    currentAddress: formData.get("currentAddress"),
    permanentSameAsCurrent: formData.get("permanentSameAsCurrent") ?? undefined,
    permanentAddress: formData.get("permanentAddress"),
  });

  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message || "Invalid profile payload", parsed.error.flatten());
  }

  return parsed.data;
}

export function parseChangePasswordFormData(formData: FormData): ChangePasswordInput {
  const parsed = changePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message || "Invalid password payload", parsed.error.flatten());
  }

  return parsed.data;
}

import { z } from "zod";
import { ValidationError } from "@/lib/domain/errors";

export const loginSchema = z.object({
  usernameOrEmail: z.string().min(1, "Username or email is required."),
  password: z.string().min(6, "Password must be at least 6 characters."),
});

export type LoginInput = z.infer<typeof loginSchema>;

export function parseLoginFormData(formData: FormData): LoginInput {
  const parsed = loginSchema.safeParse({
    usernameOrEmail: formData.get("usernameOrEmail"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message || "Enter a valid username/email and password.", parsed.error.flatten());
  }

  return parsed.data;
}

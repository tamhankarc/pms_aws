import { z } from "zod";
import { ValidationError } from "@/lib/domain/errors";

const activeFlagSchema = z.union([z.literal("on"), z.literal("true"), z.literal("1")]).optional();

export const clientSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, "Client name is required."),
  code: z.string().trim().max(20).optional().or(z.literal("")),
  isActive: activeFlagSchema,
});

export const toggleClientStatusSchema = z.object({
  clientId: z.string().min(1, "Client is required."),
});

export type ClientInput = z.infer<typeof clientSchema>;
export type ToggleClientStatusInput = z.infer<typeof toggleClientStatusSchema>;

export function parseCreateClientFormData(formData: FormData): ClientInput {
  const parsed = clientSchema.safeParse({
    name: formData.get("name"),
    code: formData.get("code"),
    isActive: formData.get("isActive") ?? "on",
  });

  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message || "Invalid client payload.", parsed.error.flatten());
  }

  return parsed.data;
}

export function parseUpdateClientFormData(formData: FormData): ClientInput {
  const parsed = clientSchema.safeParse({
    id: formData.get("id"),
    name: formData.get("name"),
    code: formData.get("code"),
    isActive: formData.get("isActive") ?? undefined,
  });

  if (!parsed.success || !parsed.data.id) {
    throw new ValidationError(parsed.success ? "Client is required." : parsed.error.issues[0]?.message || "Client is required.");
  }

  return parsed.data;
}

export function parseToggleClientStatusFormData(formData: FormData): ToggleClientStatusInput {
  const parsed = toggleClientStatusSchema.safeParse({
    clientId: formData.get("clientId"),
  });

  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message || "Client is required.", parsed.error.flatten());
  }

  return parsed.data;
}

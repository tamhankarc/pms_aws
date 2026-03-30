import { z } from "zod";
import { ValidationError } from "@/lib/domain/errors";

const activeFlagSchema = z.union([z.literal("on"), z.literal("true"), z.literal("1")]).optional();

export const employeeGroupSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, "Group name is required."),
  description: z.string().optional(),
  userIds: z.array(z.string()).optional().default([]),
  isActive: activeFlagSchema,
});

export const toggleEmployeeGroupStatusSchema = z.object({
  groupId: z.string().min(1, "Employee group is required."),
});

export type EmployeeGroupInput = z.infer<typeof employeeGroupSchema>;
export type ToggleEmployeeGroupStatusInput = z.infer<typeof toggleEmployeeGroupStatusSchema>;

export function parseCreateEmployeeGroupFormData(formData: FormData): EmployeeGroupInput {
  const parsed = employeeGroupSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") || "",
    userIds: formData.getAll("userIds").map(String),
    isActive: formData.get("isActive") ?? "on",
  });

  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message || "Invalid employee group payload.", parsed.error.flatten());
  }

  return parsed.data;
}

export function parseUpdateEmployeeGroupFormData(formData: FormData): EmployeeGroupInput {
  const parsed = employeeGroupSchema.safeParse({
    id: formData.get("id"),
    name: formData.get("name"),
    description: formData.get("description") || "",
    userIds: formData.getAll("userIds").map(String),
    isActive: formData.get("isActive") ?? undefined,
  });

  if (!parsed.success || !parsed.data.id) {
    throw new ValidationError(parsed.success ? "Employee group is required." : parsed.error.issues[0]?.message || "Employee group is required.");
  }

  return parsed.data;
}

export function parseToggleEmployeeGroupStatusFormData(formData: FormData): ToggleEmployeeGroupStatusInput {
  const parsed = toggleEmployeeGroupStatusSchema.safeParse({
    groupId: formData.get("groupId"),
  });

  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message || "Employee group is required.", parsed.error.flatten());
  }

  return parsed.data;
}

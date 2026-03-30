import { z } from "zod";
import { ValidationError } from "@/lib/domain/errors";

export const operationalRoles = [
  "DEVELOPER",
  "QA",
  "DESIGNER",
  "LOCALIZATION",
  "DEVOPS",
  "PROJECT_MANAGER",
  "OTHER",
] as const;

export const functionalRoles = [...operationalRoles, "BILLING"] as const;
export const userTypes = ["ADMIN", "MANAGER", "TEAM_LEAD", "EMPLOYEE", "REPORT_VIEWER", "ACCOUNTS"] as const;

const activeFlagSchema = z.union([z.literal("on"), z.literal("true"), z.literal("1")]).optional();

export const userBaseSchema = z.object({
  id: z.string().optional(),
  fullName: z.string().min(2),
  username: z
    .string()
    .trim()
    .min(3, "Username must be at least 3 characters.")
    .max(50)
    .regex(/^[a-z0-9._-]+$/i, "Username can only contain letters, numbers, dot, underscore, and hyphen."),
  email: z.string().email(),
  password: z.string().min(6).optional(),
  userType: z.enum(userTypes),
  functionalRole: z.enum(functionalRoles),
  employeeCode: z.string().trim().max(50).optional().or(z.literal("")),
  designation: z.string().trim().max(120).optional().or(z.literal("")),
  joiningDate: z.string().optional().or(z.literal("")),
  phoneNumber: z.string().trim().max(30).optional().or(z.literal("")),
  groupIds: z.array(z.string()).optional().default([]),
  isActive: activeFlagSchema,
});

export const teamLeadAssignmentSchema = z.object({
  teamLeadId: z.string().min(1),
  employeeId: z.string().min(1),
});

export const toggleUserStatusSchema = z.object({
  userId: z.string().min(1, "User is required."),
});

export type FunctionalRole = (typeof functionalRoles)[number];
export type UserTypeInput = (typeof userTypes)[number];
export type UserInput = z.infer<typeof userBaseSchema>;
export type TeamLeadAssignmentInput = z.infer<typeof teamLeadAssignmentSchema>;
export type ToggleUserStatusInput = z.infer<typeof toggleUserStatusSchema>;

export function parseCreateUserFormData(formData: FormData): UserInput {
  const parsed = userBaseSchema.safeParse({
    fullName: formData.get("fullName"),
    username: formData.get("username"),
    email: formData.get("email"),
    password: formData.get("password"),
    userType: formData.get("userType"),
    functionalRole: formData.get("functionalRole"),
    employeeCode: formData.get("employeeCode") || "",
    designation: formData.get("designation") || "",
    joiningDate: formData.get("joiningDate") || "",
    phoneNumber: formData.get("phoneNumber"),
    groupIds: formData.getAll("groupIds").map(String),
    isActive: formData.get("isActive") ?? "on",
  });

  if (!parsed.success || !parsed.data.password) {
    throw new ValidationError(parsed.success ? "Password is required." : parsed.error.issues[0]?.message || "Invalid user payload.", parsed.success ? undefined : parsed.error.flatten());
  }

  return parsed.data;
}

export function parseUpdateUserFormData(formData: FormData): UserInput {
  const parsed = userBaseSchema.safeParse({
    id: formData.get("id"),
    fullName: formData.get("fullName"),
    username: formData.get("username"),
    email: formData.get("email"),
    userType: formData.get("userType"),
    functionalRole: formData.get("functionalRole"),
    employeeCode: formData.get("employeeCode") || "",
    designation: formData.get("designation") || "",
    joiningDate: formData.get("joiningDate") || "",
    phoneNumber: formData.get("phoneNumber"),
    groupIds: formData.getAll("groupIds").map(String),
    isActive: formData.get("isActive") ?? undefined,
  });

  if (!parsed.success || !parsed.data.id) {
    throw new ValidationError(parsed.success ? "User is required." : parsed.error.issues[0]?.message || "User is required.", parsed.success ? undefined : parsed.error.flatten());
  }

  return parsed.data;
}

export function parseSupervisorIds(formData: FormData) {
  return formData.getAll("supervisorIds").map(String).filter(Boolean);
}

export function parseAssignTeamLeadFormData(formData: FormData): TeamLeadAssignmentInput {
  const parsed = teamLeadAssignmentSchema.safeParse({
    teamLeadId: formData.get("teamLeadId"),
    employeeId: formData.get("employeeId"),
  });

  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message || "Invalid assignment payload", parsed.error.flatten());
  }

  return parsed.data;
}

export function parseToggleUserStatusFormData(formData: FormData): ToggleUserStatusInput {
  const parsed = toggleUserStatusSchema.safeParse({
    userId: formData.get("userId"),
  });

  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message || "User is required.", parsed.error.flatten());
  }

  return parsed.data;
}

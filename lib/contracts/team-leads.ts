import { z } from "zod";
import { ValidationError } from "@/lib/domain/errors";

export const replaceEmployeeSupervisorsSchema = z.object({
  employeeId: z.string().min(1, "Employee is required."),
  supervisorIds: z.array(z.string()).default([]),
});

export const employeeSupervisorSchema = z.object({
  employeeId: z.string().min(1, "Employee is required."),
  supervisorId: z.string().min(1, "Supervisor is required."),
});

export type ReplaceEmployeeSupervisorsInput = z.infer<typeof replaceEmployeeSupervisorsSchema>;
export type EmployeeSupervisorInput = z.infer<typeof employeeSupervisorSchema>;

export function parseReplaceEmployeeSupervisorsInput(employeeId: string, supervisorIds: string[]): ReplaceEmployeeSupervisorsInput {
  const parsed = replaceEmployeeSupervisorsSchema.safeParse({ employeeId, supervisorIds });
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message || "Invalid supervisor assignment payload", parsed.error.flatten());
  }
  return parsed.data;
}

export function parseEmployeeSupervisorInput(employeeId: string, supervisorId: string): EmployeeSupervisorInput {
  const parsed = employeeSupervisorSchema.safeParse({ employeeId, supervisorId });
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message || "Invalid supervisor assignment payload", parsed.error.flatten());
  }
  return parsed.data;
}

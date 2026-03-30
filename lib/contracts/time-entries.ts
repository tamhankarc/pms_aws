import { z } from "zod";
import { ValidationError } from "@/lib/domain/errors";

export const createTimeEntrySchema = z.object({
  projectId: z.string().min(1),
  countryId: z.string().optional(),
  workDate: z.string().min(1),
  taskName: z.string().trim().min(2, "Task name is required.").max(200),
  minutesSpent: z.coerce.number().int().positive(),
  isBillable: z.coerce.boolean().default(true),
  notes: z.string().optional(),
});

export const updateTimeEntrySchema = z.object({
  entryId: z.string().min(1),
  countryId: z.string().optional(),
  workDate: z.string().min(1),
  taskName: z.string().trim().min(2, "Task name is required.").max(200),
  minutesSpent: z.coerce.number().int().positive(),
  isBillable: z.coerce.boolean().default(true),
  notes: z.string().optional(),
});

export type CreateTimeEntryInput = z.infer<typeof createTimeEntrySchema>;
export type UpdateTimeEntryInput = z.infer<typeof updateTimeEntrySchema>;

export function parseCreateTimeEntryFormData(formData: FormData): CreateTimeEntryInput {
  const parsed = createTimeEntrySchema.safeParse({
    projectId: formData.get("projectId"),
    countryId: formData.get("countryId") || undefined,
    workDate: formData.get("workDate"),
    taskName: formData.get("taskName"),
    minutesSpent: formData.get("minutesSpent"),
    isBillable: formData.get("isBillable") === "true",
    notes: formData.get("notes") || "",
  });

  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message || "Invalid time entry payload", parsed.error.flatten());
  }

  return parsed.data;
}

export function parseUpdateTimeEntryFormData(formData: FormData): UpdateTimeEntryInput {
  const parsed = updateTimeEntrySchema.safeParse({
    entryId: formData.get("entryId"),
    countryId: formData.get("countryId") || undefined,
    workDate: formData.get("workDate"),
    taskName: formData.get("taskName"),
    minutesSpent: formData.get("minutesSpent"),
    isBillable: formData.get("isBillable") === "true",
    notes: formData.get("notes") || "",
  });

  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message || "Invalid time entry update payload", parsed.error.flatten());
  }

  return parsed.data;
}

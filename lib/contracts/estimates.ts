import { z } from "zod";
import { ValidationError } from "@/lib/domain/errors";

export const createEstimateSchema = z.object({
  projectId: z.string().min(1),
  countryId: z.string().optional(),
  workDate: z.string().min(1),
  estimatedMinutes: z.coerce.number().int().positive(),
  notes: z.string().optional(),
});

export const reviewEstimateSchema = z.object({
  estimateId: z.string().min(1),
  action: z.enum(["APPROVED", "REJECTED", "REVISED"]),
  comment: z.string().optional(),
});

export const updateEstimateSchema = z.object({
  estimateId: z.string().min(1),
  countryId: z.string().optional(),
  workDate: z.string().min(1),
  estimatedMinutes: z.coerce.number().int().positive(),
  notes: z.string().optional(),
});

export type CreateEstimateInput = z.infer<typeof createEstimateSchema>;
export type ReviewEstimateInput = z.infer<typeof reviewEstimateSchema>;
export type UpdateEstimateInput = z.infer<typeof updateEstimateSchema>;

export function parseCreateEstimateFormData(formData: FormData): CreateEstimateInput {
  const parsed = createEstimateSchema.safeParse({
    projectId: formData.get("projectId"),
    countryId: formData.get("countryId") || undefined,
    workDate: formData.get("workDate"),
    estimatedMinutes: formData.get("estimatedMinutes"),
    notes: formData.get("notes") || "",
  });

  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message || "Invalid estimate payload", parsed.error.flatten());
  }

  return parsed.data;
}

export function parseReviewEstimateFormData(formData: FormData): ReviewEstimateInput {
  const parsed = reviewEstimateSchema.safeParse({
    estimateId: formData.get("estimateId"),
    action: formData.get("action"),
    comment: formData.get("comment") || "",
  });

  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message || "Invalid estimate review payload", parsed.error.flatten());
  }

  return parsed.data;
}

export function parseUpdateEstimateFormData(formData: FormData): UpdateEstimateInput {
  const parsed = updateEstimateSchema.safeParse({
    estimateId: formData.get("estimateId"),
    countryId: formData.get("countryId") || undefined,
    workDate: formData.get("workDate"),
    estimatedMinutes: formData.get("estimatedMinutes"),
    notes: formData.get("notes") || "",
  });

  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message || "Invalid estimate update payload", parsed.error.flatten());
  }

  return parsed.data;
}

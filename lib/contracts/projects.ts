import { z } from "zod";
import { ValidationError } from "@/lib/domain/errors";

const billingModelSchema = z.enum(["HOURLY", "FIXED_FULL", "FIXED_MONTHLY"]);
const projectStatusSchema = z.enum(["DRAFT", "ACTIVE", "ON_HOLD", "COMPLETED", "ARCHIVED"]);
const billingTransactionTypeSchema = z.enum([
  "PARTIAL_BILLING",
  "UPGRADE_PRE_COMPLETION",
  "UPGRADE_POST_COMPLETION",
  "ADJUSTMENT",
]);

export const createProjectSchema = z.object({
  clientId: z.string().min(1, "Client is required."),
  movieId: z.string().optional().nullable(),
  name: z.string().min(2, "Project name is required."),
  billingModel: billingModelSchema,
  fixedContractHours: z.coerce.number().nonnegative().optional(),
  fixedMonthlyHours: z.coerce.number().nonnegative().optional(),
  status: projectStatusSchema,
  description: z.string().optional(),
  countryIds: z.array(z.string()).min(1, "At least one country is required."),
  employeeGroupIds: z.array(z.string()).min(1, "At least one employee group is required."),
});

export const updateProjectSchema = z.object({
  name: z.string().min(2, "Project name is required."),
  billingModel: billingModelSchema,
  fixedContractHours: z.coerce.number().nonnegative().optional(),
  fixedMonthlyHours: z.coerce.number().nonnegative().optional(),
  status: projectStatusSchema,
  description: z.string().optional(),
  countryIds: z.array(z.string()).min(1, "At least one country is required."),
  employeeGroupIds: z.array(z.string()).min(1, "At least one employee group is required."),
});

export const createBillingTransactionSchema = z.object({
  projectId: z.string().min(1, "Project is required."),
  type: billingTransactionTypeSchema,
  amount: z.coerce.number().nonnegative(),
  note: z.string().min(2, "Note is required."),
});

export const toggleProjectStatusSchema = z.object({
  projectId: z.string().min(1, "Project is required."),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type CreateBillingTransactionInput = z.infer<typeof createBillingTransactionSchema>;
export type ToggleProjectStatusInput = z.infer<typeof toggleProjectStatusSchema>;

function firstIssueMessage(error: z.ZodError, fallback: string) {
  return error.issues[0]?.message || fallback;
}

export function parseCreateProjectFormData(formData: FormData): CreateProjectInput {
  const parsed = createProjectSchema.safeParse({
    clientId: formData.get("clientId"),
    movieId: formData.get("movieId") || null,
    name: formData.get("name"),
    billingModel: formData.get("billingModel"),
    fixedContractHours: formData.get("fixedContractHours") || 0,
    fixedMonthlyHours: formData.get("fixedMonthlyHours") || 0,
    status: formData.get("status"),
    description: formData.get("description") || "",
    countryIds: formData.getAll("countryIds"),
    employeeGroupIds: formData.getAll("employeeGroupIds"),
  });

  if (!parsed.success) {
    throw new ValidationError(firstIssueMessage(parsed.error, "Invalid project payload."), parsed.error.flatten());
  }

  return parsed.data;
}

export function parseUpdateProjectFormData(formData: FormData): UpdateProjectInput {
  const parsed = updateProjectSchema.safeParse({
    name: formData.get("name"),
    billingModel: formData.get("billingModel"),
    fixedContractHours: formData.get("fixedContractHours") || 0,
    fixedMonthlyHours: formData.get("fixedMonthlyHours") || 0,
    status: formData.get("status"),
    description: formData.get("description") || "",
    countryIds: formData.getAll("countryIds"),
    employeeGroupIds: formData.getAll("employeeGroupIds"),
  });

  if (!parsed.success) {
    throw new ValidationError(firstIssueMessage(parsed.error, "Invalid project payload."), parsed.error.flatten());
  }

  return parsed.data;
}

export function parseCreateBillingTransactionFormData(formData: FormData): CreateBillingTransactionInput {
  const parsed = createBillingTransactionSchema.safeParse({
    projectId: formData.get("projectId"),
    type: formData.get("type"),
    amount: formData.get("amount"),
    note: formData.get("note"),
  });

  if (!parsed.success) {
    throw new ValidationError(
      firstIssueMessage(parsed.error, "Invalid billing transaction payload."),
      parsed.error.flatten(),
    );
  }

  return parsed.data;
}

export function parseToggleProjectStatusFormData(formData: FormData): ToggleProjectStatusInput {
  const parsed = toggleProjectStatusSchema.safeParse({
    projectId: formData.get("projectId"),
  });

  if (!parsed.success) {
    throw new ValidationError(firstIssueMessage(parsed.error, "Project is required."), parsed.error.flatten());
  }

  return parsed.data;
}

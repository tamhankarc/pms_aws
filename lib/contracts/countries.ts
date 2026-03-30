import { z } from "zod";
import { ValidationError } from "@/lib/domain/errors";

const activeFlagSchema = z.union([z.literal("on"), z.literal("true"), z.literal("1")]).optional();

export const countrySchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, "Country name is required."),
  isoCode: z.string().trim().max(10).optional().or(z.literal("")),
  isActive: activeFlagSchema,
});

export const toggleCountryStatusSchema = z.object({
  countryId: z.string().min(1, "Country is required."),
});

export type CountryInput = z.infer<typeof countrySchema>;
export type ToggleCountryStatusInput = z.infer<typeof toggleCountryStatusSchema>;

export function parseCreateCountryFormData(formData: FormData): CountryInput {
  const parsed = countrySchema.safeParse({
    name: formData.get("name"),
    isoCode: formData.get("isoCode"),
    isActive: formData.get("isActive") ?? "on",
  });

  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message || "Invalid country payload.", parsed.error.flatten());
  }

  return parsed.data;
}

export function parseUpdateCountryFormData(formData: FormData): CountryInput {
  const parsed = countrySchema.safeParse({
    id: formData.get("id"),
    name: formData.get("name"),
    isoCode: formData.get("isoCode"),
    isActive: formData.get("isActive") ?? undefined,
  });

  if (!parsed.success || !parsed.data.id) {
    throw new ValidationError(parsed.success ? "Country is required." : parsed.error.issues[0]?.message || "Country is required.");
  }

  return parsed.data;
}

export function parseToggleCountryStatusFormData(formData: FormData): ToggleCountryStatusInput {
  const parsed = toggleCountryStatusSchema.safeParse({
    countryId: formData.get("countryId"),
  });

  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message || "Country is required.", parsed.error.flatten());
  }

  return parsed.data;
}

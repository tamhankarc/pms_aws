import { z } from "zod";
import { ValidationError } from "@/lib/domain/errors";

const activeFlagSchema = z.union([z.literal("on"), z.literal("true"), z.literal("1")]).optional();

export const movieSchema = z.object({
  id: z.string().optional(),
  clientId: z.string().min(1, "Client is required."),
  title: z.string().min(2, "Movie title is required."),
  code: z.string().trim().optional(),
  description: z.string().optional(),
  isActive: activeFlagSchema,
});

export const toggleMovieStatusSchema = z.object({
  movieId: z.string().min(1, "Movie is required."),
});

export type MovieInput = z.infer<typeof movieSchema>;
export type ToggleMovieStatusInput = z.infer<typeof toggleMovieStatusSchema>;

export function parseCreateMovieFormData(formData: FormData): MovieInput {
  const parsed = movieSchema.safeParse({
    clientId: formData.get("clientId"),
    title: formData.get("title"),
    code: formData.get("code") || "",
    description: formData.get("description") || "",
    isActive: formData.get("isActive") ?? "on",
  });

  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message || "Invalid movie payload.", parsed.error.flatten());
  }

  return parsed.data;
}

export function parseUpdateMovieFormData(formData: FormData): MovieInput {
  const parsed = movieSchema.safeParse({
    id: formData.get("id"),
    clientId: formData.get("clientId"),
    title: formData.get("title"),
    code: formData.get("code") || "",
    description: formData.get("description") || "",
    isActive: formData.get("isActive") ?? undefined,
  });

  if (!parsed.success || !parsed.data.id) {
    throw new ValidationError(parsed.success ? "Movie is required." : parsed.error.issues[0]?.message || "Movie is required.");
  }

  return parsed.data;
}

export function parseToggleMovieStatusFormData(formData: FormData): ToggleMovieStatusInput {
  const parsed = toggleMovieStatusSchema.safeParse({
    movieId: formData.get("movieId"),
  });

  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message || "Movie is required.", parsed.error.flatten());
  }

  return parsed.data;
}

"use server";

import { revalidatePath } from "next/cache";
import { requireUserTypes } from "@/lib/auth";
import {
  parseCreateMovieFormData,
  parseToggleMovieStatusFormData,
  parseUpdateMovieFormData,
} from "@/lib/contracts/movies";
import { getErrorMessage } from "@/lib/domain/errors";
import { createMovie, toggleMovieStatus, updateMovie } from "@/lib/services/movie-service";

export type MovieFormState = {
  success?: boolean;
  error?: string;
};

export async function createMovieAction(
  _prevState: MovieFormState,
  formData: FormData,
): Promise<MovieFormState> {
  try {
    await requireUserTypes(["ADMIN", "MANAGER"]);
    const input = parseCreateMovieFormData(formData);

    await createMovie(input);

    revalidatePath("/movies");
    revalidatePath("/projects/new");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: getErrorMessage(error),
    };
  }
}

export async function updateMovieAction(
  _prevState: MovieFormState,
  formData: FormData,
): Promise<MovieFormState> {
  try {
    await requireUserTypes(["ADMIN", "MANAGER"]);
    const input = parseUpdateMovieFormData(formData);

    await updateMovie(input);

    revalidatePath("/movies");
    revalidatePath(`/movies/${input.id}`);
    revalidatePath("/projects/new");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: getErrorMessage(error),
    };
  }
}

export async function toggleMovieStatusAction(formData: FormData) {
  await requireUserTypes(["ADMIN", "MANAGER"]);

  const input = parseToggleMovieStatusFormData(formData);
  await toggleMovieStatus(input);

  revalidatePath("/movies");
  revalidatePath(`/movies/${input.movieId}`);
  revalidatePath("/projects/new");
}

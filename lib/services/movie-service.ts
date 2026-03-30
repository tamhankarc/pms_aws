import { db } from "@/lib/db";
import type { MovieInput, ToggleMovieStatusInput } from "@/lib/contracts/movies";
import { NotFoundError } from "@/lib/domain/errors";

export async function createMovie(input: MovieInput) {
  return db.movie.create({
    data: {
      clientId: input.clientId,
      title: input.title,
      code: input.code?.trim() || null,
      description: input.description?.trim() || null,
      isActive: Boolean(input.isActive),
    },
  });
}

export async function updateMovie(input: MovieInput) {
  if (!input.id) throw new NotFoundError("Movie is required.");
  return db.movie.update({
    where: { id: input.id },
    data: {
      clientId: input.clientId,
      title: input.title,
      code: input.code?.trim() || null,
      description: input.description?.trim() || null,
      isActive: Boolean(input.isActive),
    },
  });
}

export async function toggleMovieStatus(input: ToggleMovieStatusInput) {
  const movie = await db.movie.findUnique({ where: { id: input.movieId } });
  if (!movie) throw new NotFoundError("Movie not found.");

  return db.movie.update({
    where: { id: input.movieId },
    data: { isActive: !movie.isActive },
  });
}

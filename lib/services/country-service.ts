import { db } from "@/lib/db";
import type { CountryInput, ToggleCountryStatusInput } from "@/lib/contracts/countries";
import { AuthorizationError, NotFoundError } from "@/lib/domain/errors";
import { canManageCountries } from "@/lib/permissions";
import type { SessionUser } from "@/lib/auth";

export function assertCountryAccess(user: SessionUser) {
  if (!canManageCountries(user)) {
    throw new AuthorizationError("You are not allowed to manage countries.");
  }
}

export async function createCountry(input: CountryInput) {
  return db.country.create({
    data: {
      name: input.name.trim(),
      isoCode: input.isoCode?.trim().toUpperCase() || null,
      isActive: Boolean(input.isActive),
    },
  });
}

export async function updateCountry(input: CountryInput) {
  if (!input.id) throw new NotFoundError("Country is required.");
  return db.country.update({
    where: { id: input.id },
    data: {
      name: input.name.trim(),
      isoCode: input.isoCode?.trim().toUpperCase() || null,
      isActive: Boolean(input.isActive),
    },
  });
}

export async function toggleCountryStatus(input: ToggleCountryStatusInput) {
  const country = await db.country.findUnique({ where: { id: input.countryId } });
  if (!country) throw new NotFoundError("Country not found.");

  return db.country.update({
    where: { id: input.countryId },
    data: { isActive: !country.isActive },
  });
}

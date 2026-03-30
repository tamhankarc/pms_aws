"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import {
  parseCreateCountryFormData,
  parseToggleCountryStatusFormData,
  parseUpdateCountryFormData,
} from "@/lib/contracts/countries";
import { getErrorMessage } from "@/lib/domain/errors";
import {
  assertCountryAccess,
  createCountry,
  toggleCountryStatus,
  updateCountry,
} from "@/lib/services/country-service";

export type CountryFormState = {
  success?: boolean;
  error?: string;
};

export async function createCountryAction(
  _prevState: CountryFormState,
  formData: FormData,
): Promise<CountryFormState> {
  try {
    const user = await requireUser();
    assertCountryAccess(user);
    const input = parseCreateCountryFormData(formData);

    await createCountry(input);

    revalidatePath("/countries");
    revalidatePath("/projects");
    revalidatePath("/projects/new");
    return { success: true };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

export async function updateCountryAction(
  _prevState: CountryFormState,
  formData: FormData,
): Promise<CountryFormState> {
  try {
    const user = await requireUser();
    assertCountryAccess(user);
    const input = parseUpdateCountryFormData(formData);

    await updateCountry(input);

    revalidatePath("/countries");
    revalidatePath(`/countries/${input.id}`);
    revalidatePath("/projects");
    revalidatePath("/projects/new");
    return { success: true };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

export async function toggleCountryStatusAction(formData: FormData) {
  const user = await requireUser();
  assertCountryAccess(user);

  const input = parseToggleCountryStatusFormData(formData);
  await toggleCountryStatus(input);

  revalidatePath("/countries");
  revalidatePath(`/countries/${input.countryId}`);
  revalidatePath("/projects");
  revalidatePath("/projects/new");
}

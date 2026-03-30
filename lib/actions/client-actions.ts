"use server";

import { revalidatePath } from "next/cache";
import { requireUserTypes } from "@/lib/auth";
import {
  parseCreateClientFormData,
  parseToggleClientStatusFormData,
  parseUpdateClientFormData,
} from "@/lib/contracts/clients";
import { getErrorMessage } from "@/lib/domain/errors";
import { createClient, toggleClientStatus, updateClient } from "@/lib/services/client-service";

export type ClientFormState = {
  success?: boolean;
  error?: string;
};

export async function createClientAction(
  _prevState: ClientFormState,
  formData: FormData,
): Promise<ClientFormState> {
  try {
    await requireUserTypes(["ADMIN", "MANAGER"]);
    const input = parseCreateClientFormData(formData);

    await createClient(input);

    revalidatePath("/clients");
    revalidatePath("/projects/new");
    revalidatePath("/movies");
    return { success: true };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

export async function updateClientAction(
  _prevState: ClientFormState,
  formData: FormData,
): Promise<ClientFormState> {
  try {
    await requireUserTypes(["ADMIN", "MANAGER"]);
    const input = parseUpdateClientFormData(formData);

    await updateClient(input);

    revalidatePath("/clients");
    revalidatePath(`/clients/${input.id}`);
    revalidatePath("/projects/new");
    revalidatePath("/movies");
    return { success: true };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

export async function toggleClientStatusAction(formData: FormData) {
  await requireUserTypes(["ADMIN", "MANAGER"]);

  const input = parseToggleClientStatusFormData(formData);
  await toggleClientStatus(input);

  revalidatePath("/clients");
  revalidatePath(`/clients/${input.clientId}`);
}

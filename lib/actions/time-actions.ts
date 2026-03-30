"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { parseCreateTimeEntryFormData, parseUpdateTimeEntryFormData } from "@/lib/contracts/time-entries";
import { createTimeEntry, updateTimeEntry } from "@/lib/services/time-entry-service";

export async function createTimeEntryAction(formData: FormData) {
  const user = await requireUser();
  const input = parseCreateTimeEntryFormData(formData);

  await createTimeEntry(user, input);

  revalidatePath("/time-entries");
}

export async function updateTimeEntryAction(formData: FormData) {
  const user = await requireUser();
  const input = parseUpdateTimeEntryFormData(formData);

  await updateTimeEntry(user, input);

  revalidatePath("/time-entries");
  revalidatePath(`/time-entries/${input.entryId}`);
}

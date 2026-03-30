"use server";

import { revalidatePath } from "next/cache";
import {
  createSession,
  getSession,
  requireUser,
} from "@/lib/auth";
import { parseChangePasswordFormData, parseUpdateProfileFormData } from "@/lib/contracts/profile";
import { changePassword, updateProfile } from "@/lib/services/profile-service";

export async function updateProfileAction(formData: FormData) {
  const currentUser = await requireUser();
  const input = parseUpdateProfileFormData(formData);

  const updated = await updateProfile(currentUser, input);

  await createSession({
    id: updated.id,
    username: updated.username,
    name: updated.fullName,
    fullName: updated.fullName,
    email: updated.email,
    designation: updated.designation ?? null,
    userType: updated.userType,
    functionalRole: updated.functionalRole ?? "UNASSIGNED",
  });

  revalidatePath("/profile");
  revalidatePath("/dashboard");
}

export async function changePasswordAction(formData: FormData) {
  const currentUser = await requireUser();
  const input = parseChangePasswordFormData(formData);

  await changePassword(currentUser, input);

  const session = await getSession();
  if (session) {
    await createSession(session);
  }

  revalidatePath("/profile");
}

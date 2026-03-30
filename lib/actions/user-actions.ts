"use server";

import { revalidatePath } from "next/cache";
import { requireUserTypes } from "@/lib/auth";
import {
  parseAssignTeamLeadFormData,
  parseCreateUserFormData,
  parseSupervisorIds,
  parseToggleUserStatusFormData,
  parseUpdateUserFormData,
} from "@/lib/contracts/users";
import { getErrorMessage } from "@/lib/domain/errors";
import {
  assignUserTeamLead,
  createUser,
  toggleUserStatus,
  updateUser,
} from "@/lib/services/user-service";

export type UserFormState = {
  success?: boolean;
  error?: string;
};

export async function createUserAction(
  _prevState: UserFormState,
  formData: FormData,
): Promise<UserFormState> {
  try {
    const actor = await requireUserTypes(["ADMIN", "MANAGER"]);
    const input = parseCreateUserFormData(formData);
    const supervisorIds = input.userType === "EMPLOYEE" ? parseSupervisorIds(formData) : [];

    await createUser(actor, input, supervisorIds);

    revalidatePath("/users");
    revalidatePath("/team-lead-assignments");
    revalidatePath("/employee-groups");
    return { success: true };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

export async function updateUserAction(
  _prevState: UserFormState,
  formData: FormData,
): Promise<UserFormState> {
  try {
    const actor = await requireUserTypes(["ADMIN", "MANAGER"]);
    const input = parseUpdateUserFormData(formData);
    const supervisorIds = input.userType === "EMPLOYEE" ? parseSupervisorIds(formData) : [];

    await updateUser(actor, input, supervisorIds);

    revalidatePath("/users");
    revalidatePath(`/users/${input.id}`);
    revalidatePath("/team-lead-assignments");
    revalidatePath("/employee-groups");
    return { success: true };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

export async function toggleUserStatusAction(formData: FormData) {
  await requireUserTypes(["ADMIN", "MANAGER"]);
  const input = parseToggleUserStatusFormData(formData);

  await toggleUserStatus(input.userId);

  revalidatePath("/users");
  revalidatePath(`/users/${input.userId}`);
}

export async function assignTeamLeadAction(formData: FormData) {
  const actor = await requireUserTypes(["ADMIN", "MANAGER"]);
  const input = parseAssignTeamLeadFormData(formData);

  await assignUserTeamLead(actor, input);

  revalidatePath("/team-lead-assignments");
  revalidatePath("/users");
  revalidatePath("/dashboard");
}

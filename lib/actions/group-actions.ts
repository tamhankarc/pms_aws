"use server";

import { revalidatePath } from "next/cache";
import { requireUserTypes } from "@/lib/auth";
import {
  parseCreateEmployeeGroupFormData,
  parseToggleEmployeeGroupStatusFormData,
  parseUpdateEmployeeGroupFormData,
} from "@/lib/contracts/employee-groups";
import { getErrorMessage } from "@/lib/domain/errors";
import {
  createEmployeeGroup,
  toggleEmployeeGroupStatus,
  updateEmployeeGroup,
} from "@/lib/services/employee-group-service";

export type EmployeeGroupFormState = {
  success?: boolean;
  error?: string;
};

export async function createEmployeeGroupAction(
  _prevState: EmployeeGroupFormState,
  formData: FormData,
): Promise<EmployeeGroupFormState> {
  try {
    await requireUserTypes(["ADMIN", "MANAGER", "TEAM_LEAD"]);
    const input = parseCreateEmployeeGroupFormData(formData);

    await createEmployeeGroup(input);

    revalidatePath("/employee-groups");
    revalidatePath("/projects/new");
    revalidatePath("/projects");
    return { success: true };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

export async function updateEmployeeGroupAction(
  _prevState: EmployeeGroupFormState,
  formData: FormData,
): Promise<EmployeeGroupFormState> {
  try {
    await requireUserTypes(["ADMIN", "MANAGER", "TEAM_LEAD"]);
    const input = parseUpdateEmployeeGroupFormData(formData);

    await updateEmployeeGroup(input);

    revalidatePath("/employee-groups");
    revalidatePath(`/employee-groups/${input.id}`);
    revalidatePath("/projects/new");
    revalidatePath("/projects");
    return { success: true };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

export async function toggleEmployeeGroupStatusAction(formData: FormData) {
  await requireUserTypes(["ADMIN", "MANAGER", "TEAM_LEAD"]);
  const input = parseToggleEmployeeGroupStatusFormData(formData);

  await toggleEmployeeGroupStatus(input);

  revalidatePath("/employee-groups");
  revalidatePath(`/employee-groups/${input.groupId}`);
}

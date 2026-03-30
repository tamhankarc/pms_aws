"use server";

import { revalidatePath } from "next/cache";
import { requireUserTypes } from "@/lib/auth";
import {
  parseCreateBillingTransactionFormData,
  parseCreateProjectFormData,
  parseToggleProjectStatusFormData,
  parseUpdateProjectFormData,
} from "@/lib/contracts/projects";
import { getErrorMessage } from "@/lib/domain/errors";
import {
  createBillingTransaction,
  createProject,
  toggleProjectStatus,
  updateProject,
} from "@/lib/services/project-service";

export type ProjectFormState = {
  success?: boolean;
  error?: string;
};

export async function createProjectAction(
  _prevState: ProjectFormState,
  formData: FormData,
): Promise<ProjectFormState> {
  try {
    const user = await requireUserTypes(["ADMIN", "MANAGER"]);
    const input = parseCreateProjectFormData(formData);

    await createProject(user, input);

    revalidatePath("/projects");
    revalidatePath("/projects/new");
    return { success: true };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

export async function updateProjectAction(
  projectId: string,
  _prevState: ProjectFormState,
  formData: FormData,
): Promise<ProjectFormState> {
  try {
    const user = await requireUserTypes(["ADMIN", "MANAGER"]);
    const input = parseUpdateProjectFormData(formData);

    await updateProject(user, projectId, input);

    revalidatePath("/projects");
    revalidatePath(`/projects/${projectId}`);
    revalidatePath(`/projects/${projectId}/edit`);
    return { success: true };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

export async function createBillingTransactionAction(formData: FormData) {
  await requireUserTypes(["ADMIN", "MANAGER"]);

  const input = parseCreateBillingTransactionFormData(formData);
  await createBillingTransaction(input);

  revalidatePath(`/projects/${input.projectId}`);
  revalidatePath("/projects");
}

export async function toggleProjectStatusAction(formData: FormData) {
  await requireUserTypes(["ADMIN", "MANAGER"]);

  const input = parseToggleProjectStatusFormData(formData);
  await toggleProjectStatus(input);

  revalidatePath("/projects");
  revalidatePath(`/projects/${input.projectId}`);
  revalidatePath(`/projects/${input.projectId}/edit`);
}

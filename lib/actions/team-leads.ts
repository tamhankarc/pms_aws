"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { parseEmployeeSupervisorInput, parseReplaceEmployeeSupervisorsInput } from "@/lib/contracts/team-leads";
import {
  addEmployeeSupervisor as addEmployeeSupervisorService,
  removeEmployeeSupervisor as removeEmployeeSupervisorService,
  replaceEmployeeSupervisors as replaceEmployeeSupervisorsService,
} from "@/lib/services/team-lead-service";

export async function replaceEmployeeSupervisors(
  employeeId: string,
  supervisorIds: string[],
) {
  const actor = await requireUser();
  const input = parseReplaceEmployeeSupervisorsInput(employeeId, supervisorIds);

  await replaceEmployeeSupervisorsService(actor, input);

  revalidatePath("/team-lead-assignments");
  revalidatePath("/users");
  revalidatePath(`/users/${employeeId}`);
}

export async function addEmployeeSupervisor(
  employeeId: string,
  supervisorId: string,
) {
  const actor = await requireUser();
  const input = parseEmployeeSupervisorInput(employeeId, supervisorId);

  await addEmployeeSupervisorService(actor, input);

  revalidatePath("/team-lead-assignments");
  revalidatePath("/users");
  revalidatePath(`/users/${employeeId}`);
}

export async function removeEmployeeSupervisor(
  employeeId: string,
  supervisorId: string,
) {
  const actor = await requireUser();
  const input = parseEmployeeSupervisorInput(employeeId, supervisorId);

  await removeEmployeeSupervisorService(actor, input);

  revalidatePath("/team-lead-assignments");
  revalidatePath("/users");
  revalidatePath(`/users/${employeeId}`);
}

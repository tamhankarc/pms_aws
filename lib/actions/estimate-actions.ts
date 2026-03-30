"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import {
  parseCreateEstimateFormData,
  parseReviewEstimateFormData,
  parseUpdateEstimateFormData,
} from "@/lib/contracts/estimates";
import { createEstimate, reviewEstimate, updateEstimate } from "@/lib/services/estimate-service";

export async function createEstimateAction(formData: FormData) {
  const user = await requireUser();
  const input = parseCreateEstimateFormData(formData);

  await createEstimate(user, input);

  revalidatePath("/estimates");
}

export async function reviewEstimateAction(formData: FormData) {
  const user = await requireUser();
  const input = parseReviewEstimateFormData(formData);

  await reviewEstimate(user, input);

  revalidatePath("/estimates");
}

export async function updateEstimateAction(formData: FormData) {
  const user = await requireUser();
  const input = parseUpdateEstimateFormData(formData);

  await updateEstimate(user, input);

  revalidatePath("/estimates");
  revalidatePath(`/estimates/${input.estimateId}/edit`);
}

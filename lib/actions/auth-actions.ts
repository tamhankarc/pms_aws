"use server";

import { redirect } from "next/navigation";
import { clearSession, createSession } from "@/lib/auth";
import { parseLoginFormData } from "@/lib/contracts/auth";
import { getErrorMessage } from "@/lib/domain/errors";
import { authenticateUser } from "@/lib/services/auth-service";

export async function loginAction(_state: unknown, formData: FormData) {
  try {
    const input = parseLoginFormData(formData);
    const user = await authenticateUser(input);
    if (!user) return { error: "Invalid credentials or inactive account." };

    await createSession(user);
    redirect("/dashboard");
  } catch (error) {
    return { error: getErrorMessage(error, "Enter a valid username/email and password.") };
  }
}

export async function logoutAction() {
  await clearSession();
  redirect("/login");
}

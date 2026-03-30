import { authenticate } from "@/lib/auth";
import type { LoginInput } from "@/lib/contracts/auth";

export async function authenticateUser(input: LoginInput) {
  return authenticate(input.usernameOrEmail, input.password);
}

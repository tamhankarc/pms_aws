import "server-only";
import { SignJWT, jwtVerify } from "jose";
import type { CurrentUser } from "@/lib/auth-types";

export type ApiAccessTokenUser = CurrentUser & {
  username?: string;
  name?: string;
  fullName?: string | null;
  email?: string;
  designation?: string | null;
};

function getApiSecret() {
  const secret = process.env.API_JWT_SECRET || process.env.SESSION_SECRET;
  if (!secret) throw new Error("API_JWT_SECRET or SESSION_SECRET is required");
  return new TextEncoder().encode(secret);
}

export async function createApiAccessToken(user: ApiAccessTokenUser, expiresIn: string = "15m") {
  return new SignJWT(user)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(getApiSecret());
}

export async function verifyApiAccessToken(token: string) {
  const { payload } = await jwtVerify(token, getApiSecret());
  return payload as unknown as ApiAccessTokenUser;
}

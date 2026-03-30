import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { createApiAccessToken } from "@/lib/api-token";

export async function GET() {
  const user = await getSession();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = await createApiAccessToken(user, "15m");

  return NextResponse.json({
    token,
    tokenType: "Bearer",
    expiresIn: 900,
    user: {
      id: user.id,
      fullName: user.fullName,
      username: user.username,
      email: user.email,
      userType: user.userType,
      functionalRole: user.functionalRole,
    },
  });
}

import { NextRequest, NextResponse } from "next/server";
import { getAwsApiBaseUrl, getClientsFromAws } from "@/lib/aws-api";
import { getSession } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!getAwsApiBaseUrl()) {
    return NextResponse.json(
      { error: "AWS API base URL is not configured" },
      { status: 500 },
    );
  }

  const q = request.nextUrl.searchParams.get("q") ?? "";
  const status = request.nextUrl.searchParams.get("status") ?? "all";

  try {
    const data = await getClientsFromAws({ q, status });
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

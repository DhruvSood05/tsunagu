import { generateOAuthUrl } from "corsair/oauth";
import { corsair } from "@/db/index";
import { auth } from "@/lib/auth";
import { getSessionCached } from "@/lib/session-cache";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const session = await getSessionCached(await headers());
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const reqUrl = new URL(request.url);
  const baseUrl = process.env.BETTER_AUTH_URL ?? reqUrl.origin;
  const REDIRECT_URI = `${baseUrl}/api/connect/callback`;
  const plugin = reqUrl.searchParams.get("plugin");
  if (!plugin) {
    return NextResponse.json({ error: "Missing ?plugin= param" }, { status: 400 });
  }

  const { url, state } = await generateOAuthUrl(corsair, plugin, {
    tenantId: session.user.id,
    redirectUri: REDIRECT_URI,
  });

  const response = NextResponse.redirect(url);
  response.cookies.set("corsair_oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 10,
  });
  return response;
}

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
  const baseUrl = (process.env.BETTER_AUTH_URL ?? reqUrl.origin).replace(/\/$/, "");
  const REDIRECT_URI = `${baseUrl}/api/connect/callback`;
  const plugin = reqUrl.searchParams.get("plugin");
  if (!plugin) {
    return NextResponse.json({ error: "Missing ?plugin= param" }, { status: 400 });
  }

  const { url, state } = await generateOAuthUrl(corsair, plugin, {
    tenantId: session.user.id,
    redirectUri: REDIRECT_URI,
  });

  // Force account picker + consent screen so Google always issues a refresh
  // token. URLSearchParams encodes spaces as '+' which Google's OAuth endpoint
  // treats as a literal plus, not a space, causing it to ignore the prompt
  // entirely and skip the consent screen. Use %20 to be RFC 3986 safe.
  const oauthUrl = new URL(url);
  oauthUrl.searchParams.delete("prompt");
  const finalUrl = oauthUrl.toString() + "&prompt=select_account%20consent";

  const response = NextResponse.redirect(finalUrl);
  response.cookies.set("corsair_oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 10,
  });
  return response;
}

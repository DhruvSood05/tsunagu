import { processOAuthCallback } from "corsair/oauth";
import { corsair } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const reqUrl = new URL(request.url);
  const REDIRECT_URI = `${reqUrl.origin}/api/connect/callback`;
  const BASE = reqUrl.origin;
  const { searchParams } = reqUrl;
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  if (!code || !state) {
    const res = NextResponse.redirect(`${BASE}/?error=missing_params`);
    res.cookies.delete("corsair_oauth_state");
    return res;
  }

  const storedState = request.cookies.get("corsair_oauth_state")?.value;
  if (!storedState || storedState !== state) {
    const res = NextResponse.redirect(`${BASE}/?error=invalid_state`);
    res.cookies.delete("corsair_oauth_state");
    return res;
  }

  try {
    await processOAuthCallback(corsair, {
      code,
      state,
      redirectUri: REDIRECT_URI,
    });
    const res = NextResponse.redirect(`${BASE}/dashboard`);
    res.cookies.delete("corsair_oauth_state");
    return res;
  } catch (e) {
    console.error("[corsair connect] callback error:", e);
    const res = NextResponse.redirect(`${BASE}/?error=oauth_failed`);
    res.cookies.delete("corsair_oauth_state");
    return res;
  }
}

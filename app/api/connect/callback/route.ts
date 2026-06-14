import { processOAuthCallback } from "corsair/oauth";
import { corsair } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";

const REDIRECT_URI = `${process.env.BETTER_AUTH_URL}/api/connect/callback`;
const BASE = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
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

import { processOAuthCallback } from "corsair/oauth";
import { corsair } from "@/db/index";
import { inngest } from "@/lib/inngest";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const reqUrl = new URL(request.url);
  const BASE = (process.env.BETTER_AUTH_URL ?? reqUrl.origin).replace(/\/$/, "");
  const REDIRECT_URI = `${BASE}/api/connect/callback`;
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
    const { plugin, tenantId } = await processOAuthCallback(corsair, {
      code,
      state,
      redirectUri: REDIRECT_URI,
    });

    // Notify Inngest so we know a watch needs to be registered for this user
    await inngest.send({
      name: "tsunagu/plugin.connected",
      data: { tenantId, plugin },
    }).catch(() => {}); // non-critical — don't fail the redirect if Inngest is down

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

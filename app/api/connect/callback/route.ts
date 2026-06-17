import { processOAuthCallback } from "corsair/oauth";
import { corsair } from "@/db/index";
import { inngest } from "@/lib/inngest";
import { registerGmailWatch, registerCalendarWatch } from "@/lib/register-watch";
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

    // Register the Google watch immediately — don't rely on Inngest being reachable
    if (plugin === "gmail") {
      registerGmailWatch(tenantId).catch((e) =>
        console.error("[connect] Gmail watch registration failed:", e?.message)
      );
    } else if (plugin === "googlecalendar") {
      registerCalendarWatch(tenantId).catch((e) =>
        console.error("[connect] Calendar watch registration failed:", e?.message)
      );
    }

    // Also notify Inngest (best-effort, non-critical)
    inngest.send({
      name: "tsunagu/plugin.connected",
      data: { tenantId, plugin },
    }).catch(() => {});

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

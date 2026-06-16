import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { userPreferences } from "@/db/schema";
import { getSessionCached } from "@/lib/session-cache";
import OpenAI from "openai";

export async function GET() {
  const session = await getSessionCached(await headers());
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [prefs] = await db
    .select({ openaiApiKey: userPreferences.openaiApiKey })
    .from(userPreferences)
    .where(eq(userPreferences.userId, session.user.id));

  const userKey = prefs?.openaiApiKey ?? null;
  const activeKey = userKey || process.env.OPENAI_API_KEY || "";
  const source = userKey ? "your key" : "shared key";

  if (!activeKey) {
    return NextResponse.json({ success: false, source, error: "No API key configured" });
  }

  try {
    const client = new OpenAI({ apiKey: activeKey });
    // Minimal call — just list models (no token cost)
    const list = await client.models.list();
    const models = list.data
      .map((m) => m.id)
      .filter((id) => id.startsWith("gpt-") || id.startsWith("o1") || id.startsWith("o3"))
      .sort()
      .slice(0, 5);
    return NextResponse.json({ success: true, source, models });
  } catch (err: any) {
    const msg: string = err?.message ?? "Connection failed";
    const hint = msg.includes("401") || msg.toLowerCase().includes("invalid")
      ? "Invalid API key — check it and try again."
      : msg.includes("429")
      ? "Rate limited or quota exceeded on this key."
      : msg;
    return NextResponse.json({ success: false, source, error: hint });
  }
}

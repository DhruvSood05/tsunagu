import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { userPreferences } from "@/db/schema";
import { getSessionCached } from "@/lib/session-cache";

function maskKey(key: string | null | undefined): string | null {
  if (!key) return null;
  if (key.length <= 8) return "sk-...****";
  return `${key.slice(0, 7)}...${key.slice(-4)}`;
}

export async function GET() {
  const session = await getSessionCached(await headers());
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [prefs] = await db
    .select()
    .from(userPreferences)
    .where(eq(userPreferences.userId, session.user.id));

  return NextResponse.json({
    hasSeenTour: prefs?.hasSeenTour ?? false,
    hasApiKey: !!prefs?.openaiApiKey,
    apiKeyHint: maskKey(prefs?.openaiApiKey),
  });
}

export async function PATCH(req: Request) {
  const session = await getSessionCached(await headers());
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  const setValues: Record<string, unknown> = { updatedAt: new Date() };

  if ("hasSeenTour" in body) {
    setValues.hasSeenTour = body.hasSeenTour ?? false;
  }
  if ("openaiApiKey" in body) {
    // null clears the key, a string saves it
    setValues.openaiApiKey = body.openaiApiKey ?? null;
  }

  await db
    .insert(userPreferences)
    .values({
      userId: session.user.id,
      hasSeenTour: body.hasSeenTour ?? false,
      openaiApiKey: body.openaiApiKey ?? null,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: userPreferences.userId,
      set: setValues,
    });

  return NextResponse.json({ success: true });
}

import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { userPreferences } from "@/db/schema";
import { getSessionCached } from "@/lib/session-cache";

export async function GET() {
  const session = await getSessionCached(await headers());
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [prefs] = await db
    .select()
    .from(userPreferences)
    .where(eq(userPreferences.userId, session.user.id));

  return NextResponse.json({ hasSeenTour: prefs?.hasSeenTour ?? false });
}

export async function PATCH(req: Request) {
  const session = await getSessionCached(await headers());
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  await db
    .insert(userPreferences)
    .values({ userId: session.user.id, hasSeenTour: body.hasSeenTour ?? false, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: userPreferences.userId,
      set: { hasSeenTour: body.hasSeenTour ?? false, updatedAt: new Date() },
    });

  return NextResponse.json({ success: true });
}

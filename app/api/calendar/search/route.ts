import { corsair } from "@/db";
import { getSessionCached } from "@/lib/session-cache";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const session = await getSessionCached(await headers());
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? "";
  if (!q.trim()) return NextResponse.json({ events: [] });

  const now = new Date();
  // Search 1 month back → 6 months ahead so users can find past and upcoming events
  const timeMin = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
  const timeMax = new Date(now.getFullYear(), now.getMonth() + 6, 30).toISOString();

  try {
    const result = await corsair.withTenant(session.user.id).googlecalendar.api.events.getMany({
      calendarId: "primary",
      q,
      timeMin,
      timeMax,
      maxResults: 8,
      singleEvents: true,
      orderBy: "startTime",
    });

    return NextResponse.json({ events: result.items ?? [] });
  } catch (err: any) {
    console.error("[api/calendar/search]", err?.message ?? err);
    return NextResponse.json({ error: "Search failed", events: [] }, { status: 500 });
  }
}

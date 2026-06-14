import { corsair } from "@/db";
import { getSessionCached } from "@/lib/session-cache";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getSessionCached(await headers());
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const tenant = corsair.withTenant(session.user.id);
    const stored = await tenant.googlecalendar.db.calendars.list({ limit: 100 });

    if (stored.length > 0) {
      const calendars = stored.map((c) => ({
        id:       c.entity_id,
        summary:  c.data.summary,
        timeZone: c.data.timeZone,
      }));
      return NextResponse.json({ calendars });
    }

    // Backfill hasn't run yet — fall back to primary only
    return NextResponse.json({ calendars: [{ id: "primary", summary: "My Calendar" }] });
  } catch (err: any) {
    console.error("[api/calendar/calendars GET]", err?.message ?? err);
    return NextResponse.json({ calendars: [{ id: "primary", summary: "My Calendar" }] });
  }
}

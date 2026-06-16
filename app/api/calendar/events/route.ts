import { corsair } from "@/db";
import { getSessionCached } from "@/lib/session-cache";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

function isTokenError(err: any): boolean {
  const msg = String(err?.message ?? "").toLowerCase();
  const status = err?.status ?? err?.statusCode ?? 0;
  return (
    status === 401 ||
    msg.includes("invalid_grant") ||
    msg.includes("token expired") ||
    msg.includes("token has been") ||
    msg.includes("unauthorized") ||
    msg.includes("unauthenticated") ||
    msg.includes("401")
  );
}

export async function GET(req: Request) {
  const session = await getSessionCached(await headers());
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const timeMin = searchParams.get("timeMin") ?? new Date().toISOString();
  const timeMax =
    searchParams.get("timeMax") ??
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  const calendarIdsParam = searchParams.get("calendarIds");
  const calendarIds = calendarIdsParam
    ? calendarIdsParam.split(",").map((s) => s.trim()).filter(Boolean)
    : ["primary"];

  try {
    const tenant = corsair.withTenant(session.user.id);

    // Fetch events for each calendar in parallel, then merge
    const perCalendar = await Promise.all(
      calendarIds.map(async (calendarId) => {
        const items: any[] = [];
        let pageToken: string | undefined;
        do {
          const result = await tenant.googlecalendar.api.events.getMany({
            calendarId,
            timeMin,
            timeMax,
            maxResults: 250,
            singleEvents: true,
            orderBy: "startTime",
            pageToken,
          });
          // Tag each event with the calendar it came from
          items.push(...(result.items ?? []).map((e: any) => ({ ...e, _calendarId: calendarId })));
          pageToken = result.nextPageToken ?? undefined;
        } while (pageToken);
        return items;
      }),
    );

    return NextResponse.json({ events: perCalendar.flat() });
  } catch (err: any) {
    console.error("[api/calendar/events GET]", err?.message ?? err);
    if (isTokenError(err)) {
      return NextResponse.json({ error: "connection_expired", plugin: "googlecalendar" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to fetch events", events: [] }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getSessionCached(await headers());
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const event = await corsair
      .withTenant(session.user.id)
      .googlecalendar.api.events.create({
        calendarId: body.calendarId,
        event: body.event,
        sendUpdates: body.sendUpdates ?? "all",
      });
    return NextResponse.json({ event });
  } catch (err: any) {
    console.error("[api/calendar/events POST]", err?.message ?? err);
    return NextResponse.json({ error: "Failed to create event" }, { status: 500 });
  }
}

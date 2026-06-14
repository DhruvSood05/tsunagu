import { corsair } from "@/db";
import { getSessionCached } from "@/lib/session-cache";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const session = await getSessionCached(await headers());
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const timeMin = searchParams.get("timeMin") ?? new Date().toISOString();
  const timeMax =
    searchParams.get("timeMax") ??
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  const maxResults = Number(searchParams.get("maxResults") ?? "50");

  try {
    const tenant = corsair.withTenant(session.user.id);
    const allItems: any[] = [];
    let pageToken: string | undefined;

    // Page through all results so every event in the range is returned
    do {
      const result = await tenant.googlecalendar.api.events.getMany({
        timeMin,
        timeMax,
        maxResults: 250,
        singleEvents: true,
        orderBy: "startTime",
        pageToken,
      });
      allItems.push(...(result.items ?? []));
      pageToken = result.nextPageToken ?? undefined;
    } while (pageToken);

    return NextResponse.json({ events: allItems });
  } catch (err: any) {
    console.error("[api/calendar/events GET]", err?.message ?? err);
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
        event: body.event,
        sendUpdates: body.sendUpdates ?? "all",
      });
    return NextResponse.json({ event });
  } catch (err: any) {
    console.error("[api/calendar/events POST]", err?.message ?? err);
    return NextResponse.json({ error: "Failed to create event" }, { status: 500 });
  }
}

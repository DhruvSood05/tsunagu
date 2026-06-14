import { corsair } from "@/db";
import { getSessionCached } from "@/lib/session-cache";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSessionCached(await headers());
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  try {
    const event = await corsair
      .withTenant(session.user.id)
      .googlecalendar.api.events.update({
        id,
        event: body.event,
        sendUpdates: body.sendUpdates ?? "all",
      });
    return NextResponse.json({ event });
  } catch (err: any) {
    console.error("[api/calendar/events/[id] PATCH]", err?.message ?? err);
    return NextResponse.json({ error: "Failed to update event" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSessionCached(await headers());
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    await corsair
      .withTenant(session.user.id)
      .googlecalendar.api.events.delete({ id, sendUpdates: "all" });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[api/calendar/events/[id] DELETE]", err?.message ?? err);
    return NextResponse.json({ error: "Failed to delete event" }, { status: 500 });
  }
}

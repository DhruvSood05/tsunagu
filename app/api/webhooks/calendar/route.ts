import { NextResponse } from "next/server";
import { db } from "@/db";
import { webhookEvents } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

// Receives real-time push notifications from Google Calendar via Corsair
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));

    // Corsair sends the tenantId in the webhook payload
    const userId = body?.tenantId ?? body?.userId ?? null;
    if (!userId) {
      return NextResponse.json({ error: "Missing tenantId" }, { status: 400 });
    }

    await db.insert(webhookEvents).values({
      id: crypto.randomUUID(),
      userId,
      eventType: "calendar",
      receivedAt: new Date(),
    });

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error("[webhooks/calendar]", err?.message ?? err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

// Client polls this to know if calendar changed since their last check
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  const since = searchParams.get("since"); // ISO timestamp

  if (!userId) return NextResponse.json({ hasUpdate: false });

  const sinceDate = since ? new Date(since) : new Date(Date.now() - 60_000);

  const [latest] = await db
    .select()
    .from(webhookEvents)
    .where(eq(webhookEvents.userId, userId))
    .orderBy(desc(webhookEvents.receivedAt))
    .limit(1);

  const hasUpdate = latest ? latest.receivedAt > sinceDate : false;

  return NextResponse.json({ hasUpdate, lastUpdated: latest?.receivedAt ?? null });
}

import { processWebhook } from "corsair";
import { corsair, db } from "@/db";
import { webhookEvents } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

// Receives real-time Gmail push notifications via Corsair
export async function POST(request: Request) {
  try {
    const headers = Object.fromEntries(request.headers);
    const body = await request.json().catch(() => ({}));
    const result = await processWebhook(corsair, headers, body);
    return result.response as unknown as Response;
  } catch (err: any) {
    console.error("[webhooks/gmail]", err?.message ?? err);
    return new Response(JSON.stringify({ error: "Internal error" }), { status: 500 });
  }
}

// Client polls this to check for new mail since last check
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  const since = searchParams.get("since");

  if (!userId) return Response.json({ hasUpdate: false });

  const sinceDate = since ? new Date(since) : new Date(Date.now() - 60_000);

  const [latest] = await db
    .select()
    .from(webhookEvents)
    .where(eq(webhookEvents.userId, userId))
    .orderBy(desc(webhookEvents.receivedAt))
    .limit(1);

  const hasUpdate = latest ? latest.receivedAt > sinceDate : false;
  return Response.json({ hasUpdate, lastUpdated: latest?.receivedAt ?? null });
}

import { processWebhook } from "corsair";
import { corsair, db } from "@/db";
import { corsairAccounts, corsairIntegrations, webhookEvents } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { inngest } from "@/lib/inngest";

async function getCalendarTenants(): Promise<string[]> {
  const rows = await db
    .select({ tenantId: corsairAccounts.tenantId })
    .from(corsairAccounts)
    .innerJoin(corsairIntegrations, eq(corsairAccounts.integrationId, corsairIntegrations.id))
    .where(eq(corsairIntegrations.name, "googlecalendar"));
  return [...new Set(rows.map((r) => r.tenantId))];
}

export async function POST(request: Request) {
  try {
    const headers = Object.fromEntries(request.headers);
    const body = await request.json().catch(() => ({}));

    const channelId = headers["x-goog-channel-id"] ?? "";
    const resourceState = headers["x-goog-resource-state"] ?? "";

    // Find all users who have Calendar connected
    const tenantIds = await getCalendarTenants();

    for (const tenantId of tenantIds) {
      try {
        await processWebhook(corsair, headers, body, { tenantId });
      } catch {
        // individual tenant failure shouldn't block others
      }

      await inngest.send({
        name: "tsunagu/calendar.event.changed",
        data: { userId: tenantId, channelId, resourceState },
      });
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (err: any) {
    console.error("[webhooks/calendar POST]", err?.message ?? err);
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  }
}

// Client polls this to check for calendar changes since last check
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

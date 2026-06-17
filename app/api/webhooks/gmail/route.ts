import { processWebhook } from "corsair";
import { corsair, db } from "@/db";
import { user, webhookEvents } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { inngest } from "@/lib/inngest";

function decodePubSubEmailAddress(body: any): { emailAddress: string; historyId: string } | null {
  try {
    const data = body?.message?.data;
    if (!data) return null;
    const decoded = JSON.parse(Buffer.from(data, "base64").toString("utf-8"));
    return {
      emailAddress: decoded.emailAddress ?? "",
      historyId: String(decoded.historyId ?? ""),
    };
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  try {
    const headers = Object.fromEntries(request.headers);
    const body = await request.json().catch(() => ({}));

    // Decode who this notification is for
    const parsed = decodePubSubEmailAddress(body);
    if (!parsed?.emailAddress) {
      // Can't route — still acknowledge to avoid Pub/Sub retry storm
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }

    // Look up the Tsunagu user who owns this Gmail address
    const [userRow] = await db
      .select({ id: user.id })
      .from(user)
      .where(eq(user.email, parsed.emailAddress))
      .limit(1);

    const tenantId = userRow?.id ?? null;

    // processWebhook with tenantId so webhookHooks.after gets the right userId
    await processWebhook(
      corsair,
      headers,
      body,
      tenantId ? { tenantId } : undefined,
    );

    // Fire Inngest event for background processing
    if (tenantId) {
      await inngest.send({
        name: "tsunagu/gmail.message.received",
        data: {
          userId: tenantId,
          emailAddress: parsed.emailAddress,
          historyId: parsed.historyId,
        },
      });
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (err: any) {
    console.error("[webhooks/gmail POST]", err?.message ?? err);
    // Still return 200 so Pub/Sub doesn't retry indefinitely
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
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

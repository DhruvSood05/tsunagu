import { db } from "@/db";
import {
  corsairAccounts,
  corsairEntities,
  corsairEvents,
  corsairIntegrations,
} from "@/db/schema";
import { auth } from "@/lib/auth";
import { getSessionCached } from "@/lib/session-cache";
import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await getSessionCached(await headers());
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;

  // Look up the gmail integration row
  const [integration] = await db
    .select({ id: corsairIntegrations.id })
    .from(corsairIntegrations)
    .where(eq(corsairIntegrations.name, "gmail"))
    .limit(1);

  if (!integration)
    return NextResponse.json({ error: "Gmail integration not found" }, { status: 404 });

  // Find this tenant's gmail account
  const [acct] = await db
    .select({ id: corsairAccounts.id })
    .from(corsairAccounts)
    .where(
      and(
        eq(corsairAccounts.tenantId, userId),
        eq(corsairAccounts.integrationId, integration.id),
      ),
    )
    .limit(1);

  if (!acct)
    return NextResponse.json({ error: "Not connected" }, { status: 404 });

  // Delete child rows first (FK: ON DELETE no action)
  await db.delete(corsairEntities).where(eq(corsairEntities.accountId, acct.id));
  await db.delete(corsairEvents).where(eq(corsairEvents.accountId, acct.id));
  await db.delete(corsairAccounts).where(eq(corsairAccounts.id, acct.id));

  return NextResponse.json({ success: true });
}

import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { db } from "@/db";
import { user, corsairAccounts, corsairEvents, corsairEntities } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSessionCached } from "@/lib/session-cache";
import { isSuperAdmin } from "@/lib/ai-rate-limit";

export async function DELETE() {
  const sess = await getSessionCached(await headers());
  if (!sess) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Superadmin cannot delete their own account
  if (isSuperAdmin(sess.user.email ?? "")) {
    return NextResponse.json({ error: "Superadmin account cannot be deleted" }, { status: 403 });
  }

  const userId = sess.user.id;

  // Clean up Corsair data (no cascade on these tables)
  const accounts = await db
    .select({ id: corsairAccounts.id })
    .from(corsairAccounts)
    .where(eq(corsairAccounts.tenantId, userId));

  for (const acc of accounts) {
    await db.delete(corsairEvents).where(eq(corsairEvents.accountId, acc.id));
    await db.delete(corsairEntities).where(eq(corsairEntities.accountId, acc.id));
  }
  await db.delete(corsairAccounts).where(eq(corsairAccounts.tenantId, userId));

  // Delete user — cascades to sessions, account, userPreferences, aiUsage,
  // chatSessions → chatMessages, webhookEvents
  await db.delete(user).where(eq(user.id, userId));

  return NextResponse.json({ ok: true });
}

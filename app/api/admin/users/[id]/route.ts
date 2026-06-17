import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { db } from "@/db";
import { user, userPreferences, corsairAccounts, corsairEvents, corsairEntities } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSessionCached } from "@/lib/session-cache";
import { isAdmin } from "@/lib/ai-rate-limit";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const sess = await getSessionCached(await headers());
  if (!sess || !isAdmin(sess.user.email ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const { aiDailyLimit, name } = body;

  if (name !== undefined) {
    await db.update(user).set({ name, updatedAt: new Date() }).where(eq(user.id, id));
  }

  if (aiDailyLimit !== undefined) {
    await db
      .insert(userPreferences)
      .values({ userId: id, aiDailyLimit, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: [userPreferences.userId],
        set: { aiDailyLimit, updatedAt: new Date() },
      });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const sess = await getSessionCached(await headers());
  if (!sess || !isAdmin(sess.user.email ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  // Cascade-delete corsair data manually (no FK on tenant_id)
  const accounts = await db
    .select({ id: corsairAccounts.id })
    .from(corsairAccounts)
    .where(eq(corsairAccounts.tenantId, id));

  for (const acc of accounts) {
    await db.delete(corsairEvents).where(eq(corsairEvents.accountId, acc.id));
    await db.delete(corsairEntities).where(eq(corsairEntities.accountId, acc.id));
  }
  await db.delete(corsairAccounts).where(eq(corsairAccounts.tenantId, id));
  await db.delete(user).where(eq(user.id, id)); // cascades sessions, preferences, aiUsage

  return NextResponse.json({ ok: true });
}

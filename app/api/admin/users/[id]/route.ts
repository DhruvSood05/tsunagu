import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { db } from "@/db";
import { user, userPreferences, corsairAccounts, corsairEvents, corsairEntities } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSessionCached } from "@/lib/session-cache";
import { isSuperAdmin } from "@/lib/ai-rate-limit";

async function getCallerRole(userId: string, email: string) {
  if (isSuperAdmin(email)) return "superadmin";
  const [prefs] = await db
    .select({ role: userPreferences.role })
    .from(userPreferences)
    .where(eq(userPreferences.userId, userId));
  return prefs?.role ?? "user";
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const sess = await getSessionCached(await headers());
  if (!sess) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const callerRole = await getCallerRole(sess.user.id, sess.user.email ?? "");
  if (callerRole !== "admin" && callerRole !== "superadmin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const { aiDailyLimit, aiAccess, role, name } = body;

  if (name !== undefined) {
    await db.update(user).set({ name, updatedAt: new Date() }).where(eq(user.id, id));
  }

  // Role changes are superadmin-only
  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (aiDailyLimit !== undefined) updates.aiDailyLimit = aiDailyLimit;
  if (aiAccess !== undefined) updates.aiAccess = aiAccess;
  if (role !== undefined && callerRole === "superadmin") updates.role = role;

  await db
    .insert(userPreferences)
    .values({ userId: id, ...updates } as any)
    .onConflictDoUpdate({ target: [userPreferences.userId], set: updates });

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const sess = await getSessionCached(await headers());
  if (!sess) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const callerRole = await getCallerRole(sess.user.id, sess.user.email ?? "");
  if (callerRole !== "superadmin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  // Don't allow deleting superadmin
  const [target] = await db.select({ email: user.email }).from(user).where(eq(user.id, id));
  if (target && isSuperAdmin(target.email)) {
    return NextResponse.json({ error: "Cannot delete superadmin" }, { status: 400 });
  }

  const accounts = await db
    .select({ id: corsairAccounts.id })
    .from(corsairAccounts)
    .where(eq(corsairAccounts.tenantId, id));

  for (const acc of accounts) {
    await db.delete(corsairEvents).where(eq(corsairEvents.accountId, acc.id));
    await db.delete(corsairEntities).where(eq(corsairEntities.accountId, acc.id));
  }
  await db.delete(corsairAccounts).where(eq(corsairAccounts.tenantId, id));
  await db.delete(user).where(eq(user.id, id));

  return NextResponse.json({ ok: true });
}

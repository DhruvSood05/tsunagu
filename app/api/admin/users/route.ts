import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { db } from "@/db";
import {
  user,
  userPreferences,
  aiUsage,
  corsairAccounts,
  corsairIntegrations,
  session as sessionTable,
} from "@/db/schema";
import { eq, sql, gte, desc } from "drizzle-orm";
import { getSessionCached } from "@/lib/session-cache";
import { isSuperAdmin, FREE_TIER_LIMIT } from "@/lib/ai-rate-limit";

function isAdminOrSuper(email: string, role?: string | null) {
  return isSuperAdmin(email) || role === "admin" || role === "superadmin";
}

export async function GET() {
  const sess = await getSessionCached(await headers());
  if (!sess) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const [callerPrefs] = await db
    .select({ role: userPreferences.role })
    .from(userPreferences)
    .where(eq(userPreferences.userId, sess.user.id));

  if (!isAdminOrSuper(sess.user.email ?? "", callerPrefs?.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const todayIST = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
  const thisMonthStart = todayIST.slice(0, 7) + "-01";

  const [users, allPrefs, usageToday, usageMonth, accounts, integrations, lastSessions] =
    await Promise.all([
      db.select().from(user).orderBy(desc(user.createdAt)),
      db.select().from(userPreferences),
      db.select({ userId: aiUsage.userId, count: aiUsage.requestCount })
        .from(aiUsage).where(eq(aiUsage.date, todayIST)),
      db.select({ userId: aiUsage.userId, count: sql<number>`sum(request_count)` })
        .from(aiUsage).where(gte(aiUsage.date, thisMonthStart))
        .groupBy(aiUsage.userId),
      db.select({ tenantId: corsairAccounts.tenantId, integrationId: corsairAccounts.integrationId })
        .from(corsairAccounts),
      db.select().from(corsairIntegrations),
      db.select({ userId: sessionTable.userId, updatedAt: sessionTable.updatedAt, expiresAt: sessionTable.expiresAt })
        .from(sessionTable).orderBy(desc(sessionTable.updatedAt)),
    ]);

  const prefsMap = new Map(allPrefs.map((p) => [p.userId, p]));
  const todayMap = new Map(usageToday.map((u) => [u.userId, u.count]));
  const monthMap = new Map(usageMonth.map((u) => [u.userId, Number(u.count)]));
  const integrations_ = integrations;

  const gmailIntId = integrations_.find((i) => i.name === "gmail")?.id;
  const calIntId = integrations_.find((i) => i.name === "googlecalendar")?.id;

  const gmailTenants = new Set(
    accounts.filter((a) => a.integrationId === gmailIntId).map((a) => a.tenantId),
  );
  const calTenants = new Set(
    accounts.filter((a) => a.integrationId === calIntId).map((a) => a.tenantId),
  );

  // updatedAt is refreshed by Better Auth on every request (session "touch"),
  // so the most recent updatedAt across all sessions = true last active time.
  const now = new Date();
  const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
  const lastActiveMap = new Map<string, string>();
  const activeNow = new Set<string>(); // users active in the last 5 minutes
  for (const s of lastSessions) {
    if (!lastActiveMap.has(s.userId)) {
      lastActiveMap.set(s.userId, s.updatedAt.toISOString());
    }
    // Consider them "live" only if they made a request in the last 5 minutes
    if (s.updatedAt > fiveMinutesAgo) {
      activeNow.add(s.userId);
    }
  }

  const result = users.map((u) => {
    const prefs = prefsMap.get(u.id);
    const aiDailyLimit = prefs?.aiDailyLimit ?? null;
    const role = isSuperAdmin(u.email) ? "superadmin" : (prefs?.role ?? "user");
    const aiAccess = isSuperAdmin(u.email) || role === "admin" || role === "superadmin" || (prefs?.aiAccess ?? false);
    const effectiveLimit = role === "admin" || role === "superadmin"
      ? -1
      : aiDailyLimit === -1
      ? -1
      : (aiDailyLimit ?? FREE_TIER_LIMIT);
    return {
      id: u.id,
      name: u.name,
      email: u.email,
      image: u.image,
      createdAt: u.createdAt,
      gmailConnected: gmailTenants.has(u.id),
      calendarConnected: calTenants.has(u.id),
      aiToday: Number(todayMap.get(u.id) ?? 0),
      aiThisMonth: monthMap.get(u.id) ?? 0,
      aiDailyLimit,
      effectiveLimit,
      aiAccess,
      role,
      lastActive: lastActiveMap.get(u.id) ?? null,
      isActive: activeNow.has(u.id),
    };
  });

  return NextResponse.json(result);
}

export async function POST(req: Request) {
  const sess = await getSessionCached(await headers());
  if (!sess) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const [callerPrefs] = await db
    .select({ role: userPreferences.role })
    .from(userPreferences)
    .where(eq(userPreferences.userId, sess.user.id));

  if (!isAdminOrSuper(sess.user.email ?? "", callerPrefs?.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { name, email, aiDailyLimit, aiAccess } = await req.json();
  if (!name?.trim() || !email?.trim()) {
    return NextResponse.json({ error: "Name and email are required" }, { status: 400 });
  }

  const [existing] = await db.select({ id: user.id }).from(user).where(eq(user.email, email.trim().toLowerCase()));
  if (existing) {
    await db
      .insert(userPreferences)
      .values({ userId: existing.id, aiDailyLimit, aiAccess: aiAccess ?? false, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: [userPreferences.userId],
        set: { aiDailyLimit, aiAccess: aiAccess ?? false, updatedAt: new Date() },
      });
    return NextResponse.json({ id: existing.id, updated: true });
  }

  const id = crypto.randomUUID().replace(/-/g, "").slice(0, 32);
  const now = new Date();
  await db.insert(user).values({
    id,
    name: name.trim(),
    email: email.trim().toLowerCase(),
    emailVerified: false,
    createdAt: now,
    updatedAt: now,
  });

  await db.insert(userPreferences).values({
    userId: id,
    aiDailyLimit,
    aiAccess: aiAccess ?? false,
    updatedAt: now,
  });

  return NextResponse.json({ id, created: true });
}

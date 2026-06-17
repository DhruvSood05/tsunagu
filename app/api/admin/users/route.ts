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
import { eq, sql, gte, desc, inArray } from "drizzle-orm";
import { getSessionCached } from "@/lib/session-cache";
import { isAdmin, FREE_TIER_LIMIT } from "@/lib/ai-rate-limit";

export async function GET() {
  const sess = await getSessionCached(await headers());
  if (!sess || !isAdmin(sess.user.email ?? "")) {
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
      db.select({ userId: sessionTable.userId, expiresAt: sessionTable.expiresAt })
        .from(sessionTable).orderBy(desc(sessionTable.expiresAt)),
    ]);

  const prefsMap = new Map(allPrefs.map((p) => [p.userId, p]));
  const todayMap = new Map(usageToday.map((u) => [u.userId, u.count]));
  const monthMap = new Map(usageMonth.map((u) => [u.userId, Number(u.count)]));
  const integrationMap = new Map(integrations.map((i) => [i.id, i.name]));

  const gmailIntId = integrations.find((i) => i.name === "gmail")?.id;
  const calIntId = integrations.find((i) => i.name === "googlecalendar")?.id;

  const gmailTenants = new Set(
    accounts.filter((a) => a.integrationId === gmailIntId).map((a) => a.tenantId),
  );
  const calTenants = new Set(
    accounts.filter((a) => a.integrationId === calIntId).map((a) => a.tenantId),
  );

  // Last active = most recent session expiry (createdAt not stored, use expiresAt - 30 days as proxy)
  const lastActiveMap = new Map<string, string>();
  for (const s of lastSessions) {
    if (!lastActiveMap.has(s.userId)) {
      // expiresAt is 30 days from login, subtract to approximate login time
      const approx = new Date(s.expiresAt.getTime() - 30 * 24 * 60 * 60 * 1000);
      lastActiveMap.set(s.userId, approx.toISOString());
    }
  }

  const result = users.map((u) => {
    const prefs = prefsMap.get(u.id);
    const aiDailyLimit = prefs?.aiDailyLimit ?? null;
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
      effectiveLimit: aiDailyLimit === -1 ? -1 : (aiDailyLimit ?? FREE_TIER_LIMIT),
      lastActive: lastActiveMap.get(u.id) ?? null,
    };
  });

  return NextResponse.json(result);
}

export async function POST(req: Request) {
  const sess = await getSessionCached(await headers());
  if (!sess || !isAdmin(sess.user.email ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { name, email, aiDailyLimit } = await req.json();
  if (!name?.trim() || !email?.trim()) {
    return NextResponse.json({ error: "Name and email are required" }, { status: 400 });
  }

  // Check if user already exists
  const [existing] = await db.select({ id: user.id }).from(user).where(eq(user.email, email.trim().toLowerCase()));
  if (existing) {
    // Just update their limit if provided
    if (aiDailyLimit !== undefined) {
      await db
        .insert(userPreferences)
        .values({ userId: existing.id, aiDailyLimit, updatedAt: new Date() })
        .onConflictDoUpdate({
          target: [userPreferences.userId],
          set: { aiDailyLimit, updatedAt: new Date() },
        });
    }
    return NextResponse.json({ id: existing.id, updated: true });
  }

  // Create new user record (they'll link Google account when they sign in)
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

  if (aiDailyLimit !== undefined) {
    await db.insert(userPreferences).values({
      userId: id,
      aiDailyLimit,
      updatedAt: now,
    });
  }

  return NextResponse.json({ id, created: true });
}

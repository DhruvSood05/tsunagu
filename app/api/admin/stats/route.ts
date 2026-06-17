import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { db } from "@/db";
import { user, aiUsage, corsairAccounts, corsairIntegrations } from "@/db/schema";
import { eq, sql, gte } from "drizzle-orm";
import { getSessionCached } from "@/lib/session-cache";
import { isAdmin } from "@/lib/ai-rate-limit";

export async function GET() {
  const session = await getSessionCached(await headers());
  if (!session || !isAdmin(session.user.email ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const todayIST = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
  const thisMonthIST = todayIST.slice(0, 7); // YYYY-MM

  const [
    totalUsers,
    aiToday,
    aiThisMonth,
    gmailRows,
    calendarRows,
  ] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(user),
    db.select({ total: sql<number>`coalesce(sum(request_count), 0)` })
      .from(aiUsage)
      .where(eq(aiUsage.date, todayIST)),
    db.select({ total: sql<number>`coalesce(sum(request_count), 0)` })
      .from(aiUsage)
      .where(gte(aiUsage.date, thisMonthIST + "-01")),
    db.select({ count: sql<number>`count(distinct tenant_id)` })
      .from(corsairAccounts)
      .innerJoin(corsairIntegrations, eq(corsairAccounts.integrationId, corsairIntegrations.id))
      .where(eq(corsairIntegrations.name, "gmail")),
    db.select({ count: sql<number>`count(distinct tenant_id)` })
      .from(corsairAccounts)
      .innerJoin(corsairIntegrations, eq(corsairAccounts.integrationId, corsairIntegrations.id))
      .where(eq(corsairIntegrations.name, "googlecalendar")),
  ]);

  return NextResponse.json({
    totalUsers: Number(totalUsers[0]?.count ?? 0),
    aiRequestsToday: Number(aiToday[0]?.total ?? 0),
    aiRequestsThisMonth: Number(aiThisMonth[0]?.total ?? 0),
    gmailConnected: Number(gmailRows[0]?.count ?? 0),
    calendarConnected: Number(calendarRows[0]?.count ?? 0),
  });
}

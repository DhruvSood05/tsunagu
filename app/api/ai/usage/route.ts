import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { aiUsage, userPreferences } from "@/db/schema";
import { getSessionCached } from "@/lib/session-cache";
import { isSuperAdmin, FREE_TIER_LIMIT } from "@/lib/ai-rate-limit";

export async function GET() {
  const session = await getSessionCached(await headers());
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Superadmin always unlimited
  if (isSuperAdmin(session.user.email ?? "")) {
    return NextResponse.json({ unlimited: true, count: 0, limit: -1, aiAccess: true, role: "superadmin" });
  }

  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });

  const [[prefs], [usage]] = await Promise.all([
    db.select({ aiDailyLimit: userPreferences.aiDailyLimit, aiAccess: userPreferences.aiAccess, role: userPreferences.role })
      .from(userPreferences)
      .where(eq(userPreferences.userId, session.user.id)),
    db.select({ requestCount: aiUsage.requestCount })
      .from(aiUsage)
      .where(and(eq(aiUsage.userId, session.user.id), eq(aiUsage.date, today))),
  ]);

  const role = prefs?.role ?? "user";
  const aiAccess = prefs?.aiAccess ?? false;

  // Admin/superadmin role → unlimited
  if (role === "admin" || role === "superadmin") {
    return NextResponse.json({ unlimited: true, count: usage?.requestCount ?? 0, limit: -1, aiAccess: true, role });
  }

  // No access
  if (!aiAccess) {
    return NextResponse.json({ unlimited: false, count: 0, limit: 0, aiAccess: false, role });
  }

  const userLimit = prefs?.aiDailyLimit;
  if (userLimit === -1) {
    return NextResponse.json({ unlimited: true, count: usage?.requestCount ?? 0, limit: -1, aiAccess: true, role });
  }

  const effectiveLimit = userLimit ?? FREE_TIER_LIMIT;
  return NextResponse.json({
    unlimited: false,
    count: usage?.requestCount ?? 0,
    limit: effectiveLimit,
    aiAccess: true,
    role,
  });
}

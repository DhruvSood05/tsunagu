import { db } from "@/db";
import { aiUsage, userPreferences } from "@/db/schema";
import { and, eq, sql } from "drizzle-orm";

export const FREE_TIER_LIMIT = 10;
const ADMIN_EMAIL = "dhruvsood1102@gmail.com";

export function isAdmin(email: string): boolean {
  return email === ADMIN_EMAIL;
}

function todayIST(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
}

export async function checkAndIncrementUsage(
  userId: string,
  userEmail: string,
): Promise<{ allowed: boolean; count: number; limit: number }> {
  // Admin always unlimited
  if (isAdmin(userEmail)) {
    return { allowed: true, count: 0, limit: FREE_TIER_LIMIT };
  }

  // Check per-user limit override
  const [prefs] = await db
    .select({ aiDailyLimit: userPreferences.aiDailyLimit })
    .from(userPreferences)
    .where(eq(userPreferences.userId, userId));

  const userLimit = prefs?.aiDailyLimit;
  // -1 = unlimited
  if (userLimit === -1) {
    return { allowed: true, count: 0, limit: -1 };
  }
  const effectiveLimit = userLimit ?? FREE_TIER_LIMIT;

  const today = todayIST();
  const [usage] = await db
    .select({ requestCount: aiUsage.requestCount })
    .from(aiUsage)
    .where(and(eq(aiUsage.userId, userId), eq(aiUsage.date, today)));

  const count = usage?.requestCount ?? 0;
  if (count >= effectiveLimit) {
    return { allowed: false, count, limit: effectiveLimit };
  }

  await db
    .insert(aiUsage)
    .values({ userId, date: today, requestCount: 1 })
    .onConflictDoUpdate({
      target: [aiUsage.userId, aiUsage.date],
      set: { requestCount: sql`${aiUsage.requestCount} + 1` },
    });

  return { allowed: true, count: count + 1, limit: effectiveLimit };
}

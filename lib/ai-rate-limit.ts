import { db } from "@/db";
import { aiUsage, userPreferences } from "@/db/schema";
import { and, eq, sql } from "drizzle-orm";

export const FREE_TIER_LIMIT = 10;
export const SUPER_ADMIN_EMAIL = "dhruvsood1102@gmail.com";

export function isSuperAdmin(email: string): boolean {
  return email === SUPER_ADMIN_EMAIL;
}

export function isAdmin(email: string): boolean {
  return email === SUPER_ADMIN_EMAIL;
}

function todayIST(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
}

async function trackUsage(userId: string): Promise<void> {
  const today = todayIST();
  await db
    .insert(aiUsage)
    .values({ userId, date: today, requestCount: 1 })
    .onConflictDoUpdate({
      target: [aiUsage.userId, aiUsage.date],
      set: { requestCount: sql`${aiUsage.requestCount} + 1` },
    });
}

export async function checkAndIncrementUsage(
  userId: string,
  userEmail: string,
): Promise<{ allowed: boolean; count: number; limit: number; noAccess?: boolean }> {
  const today = todayIST();

  // Superadmin is always allowed — track but never block
  if (isSuperAdmin(userEmail)) {
    await trackUsage(userId);
    return { allowed: true, count: 0, limit: -1 };
  }

  // Read prefs once — includes role, aiAccess, aiDailyLimit
  const [prefs] = await db
    .select({
      aiDailyLimit: userPreferences.aiDailyLimit,
      aiAccess: userPreferences.aiAccess,
      role: userPreferences.role,
    })
    .from(userPreferences)
    .where(eq(userPreferences.userId, userId));

  // Admin role — unlimited, always allowed
  if (prefs?.role === "admin" || prefs?.role === "superadmin") {
    await trackUsage(userId);
    return { allowed: true, count: 0, limit: -1 };
  }

  // No aiAccess — hard block (free tier with no grant)
  if (!prefs?.aiAccess) {
    return { allowed: false, count: 0, limit: 0, noAccess: true };
  }

  // Has access — check daily cap
  const userLimit = prefs.aiDailyLimit;
  if (userLimit === -1) {
    await trackUsage(userId);
    return { allowed: true, count: 0, limit: -1 };
  }

  const effectiveLimit = userLimit ?? FREE_TIER_LIMIT;

  const [usage] = await db
    .select({ requestCount: aiUsage.requestCount })
    .from(aiUsage)
    .where(and(eq(aiUsage.userId, userId), eq(aiUsage.date, today)));

  const count = usage?.requestCount ?? 0;
  if (count >= effectiveLimit) {
    return { allowed: false, count, limit: effectiveLimit };
  }

  await trackUsage(userId);
  return { allowed: true, count: count + 1, limit: effectiveLimit };
}

// Retrieve a user's role (for API/UI checks that can't use email)
export async function getUserPrefs(userId: string) {
  const [prefs] = await db
    .select({
      aiDailyLimit: userPreferences.aiDailyLimit,
      aiAccess: userPreferences.aiAccess,
      role: userPreferences.role,
    })
    .from(userPreferences)
    .where(eq(userPreferences.userId, userId));
  return prefs ?? { aiDailyLimit: null, aiAccess: false, role: "user" };
}

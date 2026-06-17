import { db } from "@/db";
import { aiUsage } from "@/db/schema";
import { and, eq, sql } from "drizzle-orm";

export const FREE_TIER_LIMIT = 10;

function todayIST(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
}

export async function checkAndIncrementUsage(
  userId: string,
  userEmail: string,
): Promise<{ allowed: boolean; count: number; limit: number }> {
  // Owner always allowed
  if (userEmail === "dhruvsood1102@gmail.com") {
    return { allowed: true, count: 0, limit: FREE_TIER_LIMIT };
  }

  const today = todayIST();
  const [usage] = await db
    .select({ requestCount: aiUsage.requestCount })
    .from(aiUsage)
    .where(and(eq(aiUsage.userId, userId), eq(aiUsage.date, today)));

  const count = usage?.requestCount ?? 0;
  if (count >= FREE_TIER_LIMIT) {
    return { allowed: false, count, limit: FREE_TIER_LIMIT };
  }

  await db
    .insert(aiUsage)
    .values({ userId, date: today, requestCount: 1 })
    .onConflictDoUpdate({
      target: [aiUsage.userId, aiUsage.date],
      set: { requestCount: sql`${aiUsage.requestCount} + 1` },
    });

  return { allowed: true, count: count + 1, limit: FREE_TIER_LIMIT };
}

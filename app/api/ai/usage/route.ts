import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { aiUsage } from "@/db/schema";
import { getSessionCached } from "@/lib/session-cache";

export const FREE_TIER_LIMIT = 10;
const OWNER_EMAIL = "dhruvsood1102@gmail.com";

export async function GET() {
  const session = await getSessionCached(await headers());
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (session.user.email === OWNER_EMAIL) {
    return NextResponse.json({ unlimited: true, count: 0, limit: FREE_TIER_LIMIT });
  }

  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" }); // YYYY-MM-DD IST
  const [usage] = await db
    .select({ requestCount: aiUsage.requestCount })
    .from(aiUsage)
    .where(and(eq(aiUsage.userId, session.user.id), eq(aiUsage.date, today)));

  return NextResponse.json({
    unlimited: false,
    count: usage?.requestCount ?? 0,
    limit: FREE_TIER_LIMIT,
  });
}

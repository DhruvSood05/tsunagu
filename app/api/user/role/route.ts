import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { db } from "@/db";
import { userPreferences } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSessionCached } from "@/lib/session-cache";
import { isSuperAdmin } from "@/lib/ai-rate-limit";

export async function GET() {
  const sess = await getSessionCached(await headers());
  if (!sess) return NextResponse.json({ role: "user", aiAccess: false });

  if (isSuperAdmin(sess.user.email ?? "")) {
    return NextResponse.json({ role: "superadmin", aiAccess: true });
  }

  const [prefs] = await db
    .select({ role: userPreferences.role, aiAccess: userPreferences.aiAccess })
    .from(userPreferences)
    .where(eq(userPreferences.userId, sess.user.id));

  return NextResponse.json({
    role: prefs?.role ?? "user",
    aiAccess: prefs?.aiAccess ?? false,
  });
}

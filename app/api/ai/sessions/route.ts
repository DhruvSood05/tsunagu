import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { eq, desc } from "drizzle-orm";
import { db } from "@/db";
import { chatSessions } from "@/db/schema";
import { getSessionCached } from "@/lib/session-cache";

export async function GET() {
  const session = await getSessionCached(await headers());
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sessions = await db
    .select()
    .from(chatSessions)
    .where(eq(chatSessions.userId, session.user.id))
    .orderBy(desc(chatSessions.updatedAt));

  return NextResponse.json({ sessions });
}

export async function POST(req: Request) {
  const session = await getSessionCached(await headers());
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { title } = await req.json().catch(() => ({}));

  const id = crypto.randomUUID();
  const now = new Date();

  await db.insert(chatSessions).values({
    id,
    userId: session.user.id,
    title: title || "New Chat",
    createdAt: now,
    updatedAt: now,
  });

  return NextResponse.json({ session: { id, title: title || "New Chat", createdAt: now, updatedAt: now } });
}

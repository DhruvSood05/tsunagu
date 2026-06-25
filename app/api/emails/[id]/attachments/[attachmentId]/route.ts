import { db } from "@/db";
import { account } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { getSessionCached } from "@/lib/session-cache";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

async function getFreshAccessToken(userId: string): Promise<string | null> {
  const rec = await db.query.account.findFirst({
    where: and(eq(account.userId, userId), eq(account.providerId, "google")),
  });
  if (!rec?.accessToken) return null;

  // Still valid with a 60 s buffer
  if (rec.accessTokenExpiresAt && rec.accessTokenExpiresAt.getTime() > Date.now() + 60_000) {
    return rec.accessToken;
  }

  // Expired — try to refresh
  if (!rec.refreshToken) return rec.accessToken;
  try {
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        refresh_token: rec.refreshToken,
        grant_type: "refresh_token",
      }),
    });
    if (!res.ok) return rec.accessToken;
    const data = await res.json();
    return data.access_token ?? rec.accessToken;
  } catch {
    return rec.accessToken;
  }
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string; attachmentId: string }> }
) {
  const session = await getSessionCached(await headers());
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, attachmentId } = await params;
  const { searchParams } = new URL(req.url);
  const mimeType = searchParams.get("mimeType") ?? "application/octet-stream";
  const filename = searchParams.get("filename") ?? "attachment";

  try {
    const accessToken = await getFreshAccessToken(session.user.id);
    if (!accessToken) {
      return NextResponse.json({ error: "No Google access token" }, { status: 401 });
    }

    const gmailRes = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}/attachments/${attachmentId}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (!gmailRes.ok) {
      console.error("[api/emails/attachments GET] Gmail returned", gmailRes.status);
      return NextResponse.json({ error: "Failed to fetch attachment" }, { status: gmailRes.status });
    }

    const json = await gmailRes.json();
    // Gmail returns base64url — convert to standard base64 before decoding
    const base64 = (json.data ?? "").replace(/-/g, "+").replace(/_/g, "/");
    const buffer = Buffer.from(base64, "base64");

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": mimeType,
        "Content-Disposition": `inline; filename="${encodeURIComponent(filename)}"`,
        "Content-Length": String(buffer.length),
        "Cache-Control": "private, max-age=300",
      },
    });
  } catch (err: any) {
    console.error("[api/emails/attachments GET]", err?.message ?? err);
    return NextResponse.json({ error: "Failed to fetch attachment" }, { status: 500 });
  }
}

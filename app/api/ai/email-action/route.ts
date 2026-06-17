import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { getSessionCached } from "@/lib/session-cache";
import { buildRawEmail } from "@/lib/mime";
import { corsair } from "@/db";

export async function POST(req: Request) {
  const session = await getSessionCached(await headers());
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { action, to, cc, subject, body } = await req.json() as {
    action: "send" | "draft";
    to: string;
    cc?: string;
    subject: string;
    body: string;
  };

  if (!action || !to || !subject) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  try {
    const tenant = corsair.withTenant(session.user.id);
    const userEmail = session.user.email ?? "";
    const raw = await buildRawEmail({ from: userEmail, to, cc: cc || undefined, subject, text: body ?? "" });

    if (action === "send") {
      const result = await tenant.gmail.api.messages.send({ raw });
      return NextResponse.json({ success: true, messageId: result.id });
    } else {
      const result = await tenant.gmail.api.drafts.create({ draft: { message: { raw } } });
      return NextResponse.json({ success: true, draftId: result.id });
    }
  } catch (err: any) {
    console.error("[api/ai/email-action]", err?.message ?? err);
    return NextResponse.json({ error: err?.message ?? "Failed to perform action" }, { status: 500 });
  }
}

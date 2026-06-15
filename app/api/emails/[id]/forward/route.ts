import { corsair } from "@/db";
import { getSessionCached } from "@/lib/session-cache";
import { buildRawEmail } from "@/lib/mime";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionCached(await headers());
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const formData = await req.formData();
  const to = formData.get("to") as string;
  const body = formData.get("body") as string;
  const subject = formData.get("subject") as string;
  const files = formData.getAll("attachments") as File[];

  if (!to || !body || !subject)
    return NextResponse.json({ error: "to, body and subject are required" }, { status: 400 });

  const tenant = corsair.withTenant(session.user.id);

  const attachments = await Promise.all(
    files.map(async (file) => ({
      filename: file.name,
      content: Buffer.from(await file.arrayBuffer()),
      contentType: file.type,
    }))
  );

  const raw = await buildRawEmail({
    from: session.user.email!,
    to,
    subject,
    text: body,
    attachments: attachments.length > 0 ? attachments : undefined,
  });

  try {
    const result = await tenant.gmail.api.messages.send({ raw });
    return NextResponse.json({ message: result });
  } catch (err: any) {
    console.error("[api/emails/[id]/forward POST]", err?.message ?? err);
    return NextResponse.json({ error: "Failed to forward email" }, { status: 500 });
  }
}

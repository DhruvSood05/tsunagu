import { corsair } from "@/db";
import { auth } from "@/lib/auth";
import { getSessionCached } from "@/lib/session-cache";
import { getHeader } from "@/lib/email";
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
  const files = formData.getAll("attachments") as File[];

  if (!to || !body)
    return NextResponse.json(
      { error: "to and body are required" },
      { status: 400 }
    );

  const tenant = corsair.withTenant(session.user.id);

  const original = await tenant.gmail.api.messages.get({
    id,
    format: "metadata",
    metadataHeaders: ["Subject", "Message-ID", "References"],
  });

  const messageId = getHeader(original, "Message-ID");
  const references = getHeader(original, "References");
  const subject = getHeader(original, "Subject");

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
    subject: subject.startsWith("Re:") ? subject : `Re: ${subject}`,
    text: body,
    inReplyTo: messageId,
    references: references ? `${references} ${messageId}` : messageId,
    attachments: attachments.length > 0 ? attachments : undefined,
  });

  const result = await tenant.gmail.api.messages.send({
    raw,
    threadId: original.threadId,
  });

  return NextResponse.json({ message: result });
}

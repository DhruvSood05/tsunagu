import { corsair } from "@/db";
import { auth } from "@/lib/auth";
import { getSessionCached } from "@/lib/session-cache";
import { buildRawEmail } from "@/lib/mime";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await getSessionCached(await headers());
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const to = formData.get("to") as string;
  const subject = formData.get("subject") as string;
  const body = formData.get("body") as string;
  const files = formData.getAll("attachments") as File[];

  if (!to || !subject || !body)
    return NextResponse.json(
      { error: "to, subject, and body are required" },
      { status: 400 }
    );

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

  const result = await corsair
    .withTenant(session.user.id)
    .gmail.api.messages.send({ raw });

  return NextResponse.json({ message: result });
}

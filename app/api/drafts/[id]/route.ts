import { corsair } from "@/db";
import { auth } from "@/lib/auth";
import { getSessionCached } from "@/lib/session-cache";
import { buildRawEmail } from "@/lib/mime";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionCached(await headers());
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const draft = await corsair
    .withTenant(session.user.id)
    .gmail.api.drafts.get({ id, format: "full" });

  return NextResponse.json({ draft });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionCached(await headers());
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const formData = await req.formData();
  const to = (formData.get("to") as string) ?? "";
  const subject = (formData.get("subject") as string) ?? "";
  const body = (formData.get("body") as string) ?? "";
  const files = formData.getAll("attachments") as File[];

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

  const tenant = corsair.withTenant(session.user.id);
  const draft = await tenant.gmail.api.drafts.update({
    id,
    draft: { message: { raw } },
  });

  return NextResponse.json({ draft });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionCached(await headers());
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await corsair.withTenant(session.user.id).gmail.api.drafts.delete({ id });

  return NextResponse.json({ success: true });
}

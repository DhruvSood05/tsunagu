import { corsair } from "@/db";
import { auth } from "@/lib/auth";
import { getSessionCached } from "@/lib/session-cache";
import { buildRawEmail } from "@/lib/mime";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const session = await getSessionCached(await headers());
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const pageToken = searchParams.get("pageToken") ?? undefined;

  const tenant = corsair.withTenant(session.user.id);
  const data = await tenant.gmail.api.drafts.list({ maxResults: 20, pageToken });

  return NextResponse.json({
    drafts: data.drafts ?? [],
    nextPageToken: data.nextPageToken ?? null,
  });
}

export async function POST(req: Request) {
  const session = await getSessionCached(await headers());
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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
  const draft = await tenant.gmail.api.drafts.create({
    draft: { message: { raw } },
  });

  return NextResponse.json({ draft });
}

import { corsair } from "@/db";
import { auth } from "@/lib/auth";
import { getSessionCached } from "@/lib/session-cache";
import { buildRawEmail } from "@/lib/mime";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

const CONCURRENCY = 5;

async function fetchInBatches<T>(
  items: any[],
  fn: (item: any) => Promise<T>,
): Promise<PromiseSettledResult<T>[]> {
  const results: PromiseSettledResult<T>[] = [];
  for (let i = 0; i < items.length; i += CONCURRENCY) {
    const batch = await Promise.allSettled(items.slice(i, i + CONCURRENCY).map(fn));
    results.push(...batch);
  }
  return results;
}

export async function GET(req: Request) {
  const session = await getSessionCached(await headers());
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const pageToken = searchParams.get("pageToken") ?? undefined;

  const tenant = corsair.withTenant(session.user.id);
  const data = await tenant.gmail.api.drafts.list({ maxResults: 20, pageToken });

  const results = await fetchInBatches(data.drafts ?? [], (d) =>
    tenant.gmail.api.drafts.get({ id: d.id!, format: "metadata" })
  );

  const drafts = results
    .filter((r) => r.status === "fulfilled")
    .map((r) => {
      const draft = (r as PromiseFulfilledResult<any>).value;
      const msg = draft.message ?? {};
      const subject = msg.payload?.headers?.find((h: any) => h.name === "Subject")?.value ?? "";
      return {
        id: draft.id,
        subject,
        body: msg.snippet ?? "",
      };
    });

  return NextResponse.json({
    drafts,
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

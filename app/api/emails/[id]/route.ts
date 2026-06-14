import { createHash } from "crypto";
import { corsair } from "@/db";
import { auth } from "@/lib/auth";
import { getSessionCached } from "@/lib/session-cache";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

function gravatarUrl(fromHeader: string): string {
  const emailMatch = fromHeader.match(/<([^>]+)>/);
  const email = (emailMatch ? emailMatch[1] : fromHeader).trim().toLowerCase();
  const hash = createHash("md5").update(email).digest("hex");
  return `https://www.gravatar.com/avatar/${hash}?s=80&d=404`;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionCached(await headers());
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    const message = await corsair
      .withTenant(session.user.id)
      .gmail.api.messages.get({ id, format: "full" });

    const fromHeader =
      message?.payload?.headers?.find(
        (h: any) => h.name.toLowerCase() === "from"
      )?.value ?? "";

    return NextResponse.json({
      message: { ...message, _gravatarUrl: gravatarUrl(fromHeader) },
    });
  } catch (err: any) {
    console.error("[api/emails/[id] GET]", err?.message ?? err);
    return NextResponse.json({ error: "Failed to fetch email" }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionCached(await headers());
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { addLabelIds, removeLabelIds } = await req.json();

  try {
    const message = await corsair
      .withTenant(session.user.id)
      .gmail.api.messages.modify({ id, addLabelIds, removeLabelIds });

    return NextResponse.json({ message });
  } catch (err: any) {
    console.error("[api/emails/[id] PATCH]", err?.message ?? err);
    return NextResponse.json({ error: "Failed to update email" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionCached(await headers());
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    await corsair.withTenant(session.user.id).gmail.api.messages.trash({ id });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[api/emails/[id] DELETE]", err?.message ?? err);
    return NextResponse.json({ error: "Failed to delete email" }, { status: 500 });
  }
}

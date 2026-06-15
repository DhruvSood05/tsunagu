import { corsair } from "@/db";
import { getSessionCached } from "@/lib/session-cache";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(
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
      .gmail.api.messages.modify({ id, removeLabelIds: ["INBOX"] });

    return NextResponse.json({ message });
  } catch (err: any) {
    console.error("[api/emails/[id]/archive POST]", err?.message ?? err);
    return NextResponse.json({ error: "Failed to archive email" }, { status: 500 });
  }
}

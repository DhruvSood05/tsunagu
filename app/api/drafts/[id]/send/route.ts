import { corsair } from "@/db";
import { auth } from "@/lib/auth";
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
  const result = await corsair
    .withTenant(session.user.id)
    .gmail.api.drafts.send({ id });

  return NextResponse.json({ message: result });
}

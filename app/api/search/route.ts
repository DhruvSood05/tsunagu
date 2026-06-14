import { corsair } from "@/db";
import { getSessionCached } from "@/lib/session-cache";
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
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const q         = searchParams.get("q") ?? "";
  const pageToken = searchParams.get("pageToken") ?? undefined;

  if (!q.trim()) return NextResponse.json({ messages: [], nextPageToken: null });

  const tenant = corsair.withTenant(session.user.id);

  try {
    const list = await tenant.gmail.api.messages.list({
      q,
      maxResults: 20,
      pageToken,
    });

    const results = await fetchInBatches(list.messages ?? [], (m) =>
      tenant.gmail.api.messages.get({ id: m.id!, format: "metadata" }),
    );

    const messages = results
      .filter((r) => r.status === "fulfilled")
      .map((r) => (r as PromiseFulfilledResult<any>).value);

    return NextResponse.json({
      messages,
      nextPageToken: list.nextPageToken ?? null,
    });
  } catch (err: any) {
    console.error("[api/search]", err?.message ?? err);
    return NextResponse.json(
      { error: "Search failed", messages: [], nextPageToken: null },
      { status: 500 },
    );
  }
}

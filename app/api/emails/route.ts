import { corsair } from "@/db";
import { auth } from "@/lib/auth";
import { getSessionCached } from "@/lib/session-cache";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

const CATEGORY_LABELS: Record<string, string[]> = {
  primary:    ["INBOX"],
  promotions: ["CATEGORY_PROMOTIONS"],
  social:     ["CATEGORY_SOCIAL"],
  updates:    ["CATEGORY_UPDATES"],
};

// Run at most CONCURRENCY fetches at a time so 100 simultaneous users
// don't fan out 2 000 connections to googleapis.com at once.
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
  const pageToken  = searchParams.get("pageToken")  ?? undefined;
  const maxResults = Number(searchParams.get("maxResults") ?? "20");
  const category   = searchParams.get("category") ?? "primary";

  const labelIds = CATEGORY_LABELS[category] ?? CATEGORY_LABELS.primary;
  const tenant = corsair.withTenant(session.user.id);

  try {
    const list = await tenant.gmail.api.messages.list({
      maxResults,
      pageToken,
      labelIds,
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
    console.error("[api/emails]", err?.message ?? err);
    return NextResponse.json(
      { error: "Failed to fetch emails", messages: [], nextPageToken: null },
      { status: 500 },
    );
  }
}

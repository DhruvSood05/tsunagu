import { corsair } from "@/db";
import { getSessionCached } from "@/lib/session-cache";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

/**
 * Lightning-fast search powered by Corsair's local entity cache.
 *
 * Corsair caches every Gmail message that passes through it into Postgres
 * (the `corsair_entities` table). We query that cache directly with
 * `tenant.gmail.db.messages.search(...)` instead of hitting the Gmail API —
 * results come back in single-digit milliseconds.
 *
 * Because the cache `.search()` combines field filters with AND, we run one
 * search per field (subject / from / to / snippet / body) in parallel and merge
 * the unique results to get OR-style full-text behaviour.
 *
 * If the cache is cold (returns nothing), we fall back to the Gmail API search
 * so results are never empty.
 */

const FIELDS = ["subject", "from", "to", "snippet", "body"] as const;
const PER_FIELD_LIMIT = 25;
const MAX_RESULTS = 20;

// Shape a cached entity into the Gmail metadata-message form the UI expects
// (so the existing getHeader() helpers keep working unchanged).
function toMessageShape(data: any) {
  const headersArr = [
    { name: "From", value: data.from ?? "" },
    { name: "Subject", value: data.subject ?? "" },
    { name: "To", value: data.to ?? "" },
  ];
  if (data.internalDate) {
    headersArr.push({ name: "Date", value: new Date(Number(data.internalDate)).toUTCString() });
  }
  return {
    id: data.id,
    threadId: data.threadId,
    labelIds: data.labelIds ?? [],
    snippet: data.snippet ?? "",
    internalDate: data.internalDate,
    payload: { headers: headersArr },
  };
}

export async function GET(req: Request) {
  const session = await getSessionCached(await headers());
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").trim();
  if (!q) return NextResponse.json({ messages: [], source: "cache", ms: 0 });

  const tenant = corsair.withTenant(session.user.id);
  const started = Date.now();

  try {
    // Fan out one cache search per field, then merge unique by message id.
    const perField = await Promise.allSettled(
      FIELDS.map((field) =>
        tenant.gmail.db.messages.search({
          data: { [field]: { contains: q } },
          limit: PER_FIELD_LIMIT,
        } as any)
      )
    );

    const seen = new Set<string>();
    const merged: any[] = [];
    for (const res of perField) {
      if (res.status !== "fulfilled") continue;
      for (const entity of res.value as any[]) {
        const data = entity?.data ?? entity;
        if (!data?.id || seen.has(data.id)) continue;
        seen.add(data.id);
        merged.push(toMessageShape(data));
      }
    }

    // Newest first
    merged.sort((a, b) => Number(b.internalDate ?? 0) - Number(a.internalDate ?? 0));

    if (merged.length > 0) {
      return NextResponse.json({
        messages: merged.slice(0, MAX_RESULTS),
        source: "cache",
        ms: Date.now() - started,
      });
    }

    // Cold cache → fall back to the Gmail API so results are never empty.
    const list = await tenant.gmail.api.messages.list({ q, maxResults: MAX_RESULTS });
    const fetched = await Promise.allSettled(
      (list.messages ?? []).map((m) => tenant.gmail.api.messages.get({ id: m.id!, format: "metadata" }))
    );
    const messages = fetched
      .filter((r) => r.status === "fulfilled")
      .map((r) => (r as PromiseFulfilledResult<any>).value);

    return NextResponse.json({ messages, source: "api", ms: Date.now() - started });
  } catch (err: any) {
    console.error("[api/search/local]", err?.message ?? err);
    return NextResponse.json(
      { error: "Search failed", messages: [], source: "error", ms: Date.now() - started },
      { status: 500 }
    );
  }
}

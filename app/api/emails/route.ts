import { corsair } from "@/db";
import { auth } from "@/lib/auth";
import { getSessionCached } from "@/lib/session-cache";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

function isTokenError(err: any): boolean {
  const msg = String(err?.message ?? "").toLowerCase();
  const status = err?.status ?? err?.statusCode ?? 0;
  return (
    status === 401 ||
    msg.includes("invalid_grant") ||
    msg.includes("token expired") ||
    msg.includes("token has been") ||
    msg.includes("unauthorized") ||
    msg.includes("unauthenticated") ||
    msg.includes("401")
  );
}

const CATEGORY_LABELS: Record<string, string[]> = {
  primary:    ["INBOX"],
  inbox:      ["INBOX"],
  promotions: ["CATEGORY_PROMOTIONS"],
  social:     ["CATEGORY_SOCIAL"],
  updates:    ["CATEGORY_UPDATES"],
  sent:       ["SENT"],
  starred:    ["STARRED"],
};


export async function GET(req: Request) {
  const session = await getSessionCached(await headers());
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const pageToken  = searchParams.get("pageToken")  ?? undefined;
  const maxResults = Number(searchParams.get("maxResults") ?? "20");
  const category   = searchParams.get("category") ?? "inbox";

  const tenant = corsair.withTenant(session.user.id);

  try {
    const queryParams: any = {
      maxResults,
      pageToken,
    };

    if (category === "archive") {
      queryParams.q = "-in:inbox -in:trash -in:spam -in:draft";
    } else {
      queryParams.labelIds = CATEGORY_LABELS[category] ?? CATEGORY_LABELS.inbox;
    }

    const list = await tenant.gmail.api.messages.list(queryParams);

    const results = await Promise.allSettled(
      (list.messages ?? []).map((m: any) =>
        tenant.gmail.api.messages.get({ id: m.id!, format: "metadata" }),
      ),
    );

    const messages = results
      .filter((r: any) => r.status === "fulfilled")
      .map((r: any) => r.value);

    return NextResponse.json(
      { messages, nextPageToken: list.nextPageToken ?? null },
      { headers: { "Cache-Control": "private, max-age=30, stale-while-revalidate=60" } },
    );
  } catch (err: any) {
    console.error("[api/emails]", err?.message ?? err);
    if (isTokenError(err)) {
      return NextResponse.json(
        { error: "connection_expired", plugin: "gmail" },
        { status: 401 },
      );
    }
    return NextResponse.json(
      { error: "Failed to fetch emails", messages: [], nextPageToken: null },
      { status: 500 },
    );
  }
}

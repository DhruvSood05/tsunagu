import { corsair } from "@/db";
import { getSessionCached } from "@/lib/session-cache";
import { getHeader } from "@/lib/email";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

type Priority = "high" | "medium" | "low";

// Run at most CONCURRENCY message fetches at once.
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

function emailPriority(labelIds: string[]): Priority {
  if (labelIds.includes("IMPORTANT") || labelIds.includes("STARRED")) return "high";
  if (labelIds.includes("UNREAD")) return "medium";
  return "low";
}

export async function GET() {
  const session = await getSessionCached(await headers());
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tenant = corsair.withTenant(session.user.id);

  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const d = now.getDate();
  const startOfDay = new Date(y, m, d, 0, 0, 0).toISOString();
  const endOfDay = new Date(y, m, d, 23, 59, 59, 999).toISOString();
  const gmailDate = `${y}/${String(m + 1).padStart(2, "0")}/${String(d).padStart(2, "0")}`;

  const [emails, events] = await Promise.all([
    // ── Today's important emails ────────────────────────────────────────────
    (async () => {
      try {
        const list = await tenant.gmail.api.messages.list({
          q: `in:inbox after:${gmailDate} (is:important OR is:starred OR is:unread)`,
          maxResults: 15,
        });
        const fetched = await fetchInBatches(list.messages ?? [], (msg) =>
          tenant.gmail.api.messages.get({ id: msg.id!, format: "metadata" }),
        );
        return fetched
          .filter((r) => r.status === "fulfilled")
          .map((r) => (r as PromiseFulfilledResult<any>).value)
          .map((message) => {
            const labelIds: string[] = message.labelIds ?? [];
            return {
              id: message.id as string,
              from: getHeader(message, "From"),
              subject: getHeader(message, "Subject") || "(No subject)",
              snippet: message.snippet ?? "",
              date: getHeader(message, "Date"),
              unread: labelIds.includes("UNREAD"),
              priority: emailPriority(labelIds),
            };
          });
      } catch {
        return [];
      }
    })(),

    // ── Today's calendar events ─────────────────────────────────────────────
    (async () => {
      try {
        const result = await tenant.googlecalendar.api.events.getMany({
          calendarId: "primary",
          timeMin: startOfDay,
          timeMax: endOfDay,
          singleEvents: true,
          orderBy: "startTime",
          maxResults: 25,
        });
        return (result.items ?? []).map((e: any) => ({
          id: e.id as string,
          summary: e.summary ?? "(No title)",
          location: e.location ?? null,
          start: e.start ?? null,
          end: e.end ?? null,
          allDay: !e.start?.dateTime,
          attendeesCount: Array.isArray(e.attendees) ? e.attendees.length : 0,
          htmlLink: e.htmlLink ?? null,
        }));
      } catch {
        return [];
      }
    })(),
  ]);

  return NextResponse.json({ emails, events });
}

// Shared client-side data cache.
// Module-level Maps survive React re-renders and Next.js soft navigations —
// so data fetched on one page is immediately available on the next without a
// network round-trip. All page components read/write the same Maps.

// ── Email ─────────────────────────────────────────────────────────────────────
export const emailCache = new Map<
  string,
  { messages: any[]; nextPageToken: string | null; fetchedAt: number }
>();

// ── Calendar ──────────────────────────────────────────────────────────────────
export const calEventsCache = new Map<
  string,
  { events: any[]; fetchedAt: number }
>();

export const calListCache = new Map<
  string,
  { list: any[]; fetchedAt: number }
>();

// ── Drafts ────────────────────────────────────────────────────────────────────
export const draftsCache = new Map<
  string,
  { drafts: any[]; nextPageToken: string | null; fetchedAt: number }
>();

// ── Utilities ─────────────────────────────────────────────────────────────────
export function clearAllCaches() {
  emailCache.clear();
  calEventsCache.clear();
  calListCache.clear();
  draftsCache.clear();
}

// Finds a cached events entry whose stored date range fully covers [min, max].
// Used so a wide prefetch range (e.g. two months) satisfies a narrower request
// (e.g. the exact FullCalendar grid window) without a key collision.
export function findCachedEventsForRange(
  userId: string,
  ids: string[],
  min: string,
  max: string,
): { events: any[]; fetchedAt: number } | undefined {
  const sortedIds = [...ids].sort().join(",");
  for (const [key, entry] of calEventsCache) {
    const parts = key.split("|");
    if (parts[0] !== userId || parts[1] !== sortedIds) continue;
    if (parts[2] <= min && parts[3] >= max) return entry;
  }
  return undefined;
}

// ── Background prefetchers ────────────────────────────────────────────────────
// Called proactively (on mount or sidebar hover) so data is warm the moment
// the user navigates to Calendar or Drafts.

let _prefetchingCal = false;
export async function prefetchCalendar(userId: string) {
  // Skip if already in flight or calendar list already cached
  if (_prefetchingCal || calListCache.has(userId)) return;
  _prefetchingCal = true;
  try {
    const r = await fetch("/api/calendar/calendars");
    if (!r.ok) return;
    const { calendars: raw = [] } = await r.json();
    const PALETTE = ["#4285f4","#0f9d58","#db4437","#f4b400","#673ab7","#3f51b5","#00bcd4","#ff5722"];
    const list = raw.map((c: any, i: number) => ({
      id: c.id,
      summary: c.summary,
      color: PALETTE[i % PALETTE.length],
    }));
    calListCache.set(userId, { list, fetchedAt: Date.now() });

    const ids = list.map((c: any) => c.id).sort();
    if (ids.length === 0) return;

    // Prefetch two months of events (current + next) with a wide key.
    // findCachedEventsForRange() in CalendarContent will match this against
    // whatever narrower range FullCalendar requests.
    const now = new Date();
    const min = new Date(Date.UTC(now.getFullYear(), now.getMonth() - 1, 1)).toISOString();
    const max = new Date(Date.UTC(now.getFullYear(), now.getMonth() + 2, 1)).toISOString();
    const evKey = `${userId}|${ids.join(",")}|${min}|${max}`;
    if (calEventsCache.has(evKey)) return;

    const er = await fetch(
      `/api/calendar/events?timeMin=${encodeURIComponent(min)}&timeMax=${encodeURIComponent(max)}&calendarIds=${encodeURIComponent(ids.join(","))}`,
    );
    if (!er.ok) return;
    const { events = [] } = await er.json();
    calEventsCache.set(evKey, { events, fetchedAt: Date.now() });
  } catch {
    // best-effort — never throw
  } finally {
    _prefetchingCal = false;
  }
}

let _prefetchingDrafts = false;
export async function prefetchDrafts(userId: string) {
  if (_prefetchingDrafts || draftsCache.has(`${userId}:`)) return;
  _prefetchingDrafts = true;
  try {
    const r = await fetch("/api/drafts");
    if (!r.ok) return;
    const { drafts = [], nextPageToken = null } = await r.json();
    draftsCache.set(`${userId}:`, { drafts, nextPageToken, fetchedAt: Date.now() });
  } catch {
    // best-effort
  } finally {
    _prefetchingDrafts = false;
  }
}

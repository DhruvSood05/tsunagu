import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { db } from "@/db";
import { user, aiUsage, chatMessages } from "@/db/schema";
import { eq, sql, gte } from "drizzle-orm";
import { getSessionCached } from "@/lib/session-cache";
import { isAdmin } from "@/lib/ai-rate-limit";

function classifyMessage(toolsUsed: unknown, artifacts: unknown): string {
  const arts = Array.isArray(artifacts) ? artifacts : [];
  if (arts.length > 0) {
    const kinds = arts.map((a: any) => a?.kind);
    if (kinds.includes("email")) return "email_draft";
    if (kinds.includes("event")) return "calendar_event";
  }
  const tools = Array.isArray(toolsUsed)
    ? (toolsUsed as string[]).join(" ").toLowerCase()
    : "";
  if (tools.length > 0) {
    if (tools.includes("calendar") || tools.includes("event")) return "calendar_event";
    // Any other tool call is inbox-related (gmail, messages, labels, drafts, threads, run_script)
    return "inbox_summary";
  }
  return "general";
}

export async function GET() {
  const session = await getSessionCached(await headers());
  if (!session || !isAdmin(session.user.email ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const now = new Date();
  const todayIST = now.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
  const monthStart = todayIST.slice(0, 7) + "-01";

  // Last 14 days for daily chart
  const days14: string[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    days14.push(d.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" }));
  }

  const [dailyRows, allUsers, allAssistantMessages, thisMonthUsage] = await Promise.all([
    // Daily totals last 14 days
    db
      .select({ date: aiUsage.date, total: sql<number>`sum(request_count)` })
      .from(aiUsage)
      .where(gte(aiUsage.date, days14[0]))
      .groupBy(aiUsage.date)
      .orderBy(aiUsage.date),

    // All users for name/image lookup
    db.select({ id: user.id, name: user.name, email: user.email, image: user.image }).from(user),

    // ALL assistant messages ever — no date filter so all users' history is counted
    db
      .select({
        userId: chatMessages.userId,
        toolsUsed: chatMessages.toolsUsed,
        artifacts: chatMessages.artifacts,
      })
      .from(chatMessages)
      .where(eq(chatMessages.role, "assistant")),

    // Per-user credit totals this month from aiUsage (source of truth for billing)
    db
      .select({ userId: aiUsage.userId, count: sql<number>`sum(request_count)` })
      .from(aiUsage)
      .where(gte(aiUsage.date, monthStart))
      .groupBy(aiUsage.userId)
      .orderBy(sql`sum(request_count) desc`)
      .limit(10),
  ]);

  // Fill daily chart gaps with 0
  const dailyMap = new Map(dailyRows.map((r) => [r.date, Number(r.total)]));
  const dailyChart = days14.map((date) => ({
    date: date.slice(5), // MM-DD
    requests: dailyMap.get(date) ?? 0,
  }));

  // ── Category classification ──────────────────────────────────────────────
  // Aggregate ALL assistant messages across ALL users (all time)
  const categoryTotals = { inbox_summary: 0, email_draft: 0, calendar_event: 0, general: 0 };
  const userCategoryMap = new Map<
    string,
    { inbox_summary: number; email_draft: number; calendar_event: number; general: number }
  >();

  for (const msg of allAssistantMessages) {
    const cat = classifyMessage(msg.toolsUsed, msg.artifacts) as keyof typeof categoryTotals;
    categoryTotals[cat]++;

    if (!userCategoryMap.has(msg.userId)) {
      userCategoryMap.set(msg.userId, { inbox_summary: 0, email_draft: 0, calendar_event: 0, general: 0 });
    }
    userCategoryMap.get(msg.userId)![cat]++;
  }

  const categoryChart = [
    { name: "Inbox Summary", value: categoryTotals.inbox_summary, color: "#6366f1" },
    { name: "Email Drafts", value: categoryTotals.email_draft, color: "#8b5cf6" },
    { name: "Calendar Events", value: categoryTotals.calendar_event, color: "#06b6d4" },
    { name: "General", value: categoryTotals.general, color: "#64748b" },
  ];

  // ── Top users ────────────────────────────────────────────────────────────
  // Primary: aiUsage this month (most accurate credit count).
  // Fallback: include any user who has chatMessages but no aiUsage row this month
  // (e.g. admin before tracking was fixed).
  const userMap = new Map(allUsers.map((u) => [u.id, u]));
  const usageEntries = new Map(thisMonthUsage.map((r) => [r.userId, Number(r.count)]));

  // All users who have EITHER monthly aiUsage OR any chat messages at all
  const allActiveIds = new Set([
    ...usageEntries.keys(),
    ...userCategoryMap.keys(),
  ]);

  const topUsers = [...allActiveIds]
    .map((uid) => {
      const u = userMap.get(uid);
      const cats = userCategoryMap.get(uid) ?? {
        inbox_summary: 0,
        email_draft: 0,
        calendar_event: 0,
        general: 0,
      };
      const total = usageEntries.get(uid) ?? 0;
      const chatTotal = Object.values(cats).reduce((a, b) => a + b, 0);
      return {
        id: uid,
        name: u?.name ?? "Unknown",
        email: u?.email ?? "",
        image: u?.image ?? null,
        // Show aiUsage count as credits; if not tracked yet, fall back to chat count
        total: total > 0 ? total : chatTotal,
        inbox_summary: cats.inbox_summary,
        email_draft: cats.email_draft,
        calendar_event: cats.calendar_event,
        general: cats.general,
      };
    })
    .filter((u) => u.total > 0 || Object.values(u).some((v) => typeof v === "number" && v > 0))
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);

  return NextResponse.json({
    dailyChart,
    categoryChart,
    categoryTotals,
    topUsers,
    totalThisMonth: thisMonthUsage.reduce((s, r) => s + Number(r.count), 0),
  });
}

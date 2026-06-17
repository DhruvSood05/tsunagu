"use client";

import { useEffect, useState, useCallback } from "react";
import Sidebar from "@/components/layout/Sidebar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  RiUserLine,
  RiMailLine,
  RiCalendarLine,
  RiSparkling2Line,
  RiAddLine,
  RiEditLine,
  RiDeleteBinLine,
  RiShieldLine,
  RiLoader4Line,
  RiCheckLine,
  RiInfinityLine,
  RiBarChartLine,
  RiTimeLine,
  RiSearchLine,
} from "@remixicon/react";

interface Stats {
  totalUsers: number;
  aiRequestsToday: number;
  aiRequestsThisMonth: number;
  gmailConnected: number;
  calendarConnected: number;
}

interface AnalyticsData {
  dailyChart: { date: string; requests: number }[];
  categoryChart: { name: string; value: number; color: string }[];
  topUsers: {
    id: string;
    name: string;
    email: string;
    image: string | null;
    total: number;
    inbox_summary: number;
    email_draft: number;
    calendar_event: number;
    general: number;
  }[];
  totalThisMonth: number;
  categoryTotals: {
    inbox_summary: number;
    email_draft: number;
    calendar_event: number;
    general: number;
  };
}

interface UserRow {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  createdAt: string;
  gmailConnected: boolean;
  calendarConnected: boolean;
  aiToday: number;
  aiThisMonth: number;
  aiDailyLimit: number | null;
  effectiveLimit: number;
  lastActive: string | null;
}

function Avatar({ name, image, size = "sm" }: { name: string; image?: string | null; size?: "sm" | "md" }) {
  const [err, setErr] = useState(false);
  const initials = name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "?";
  const cls = size === "md" ? "size-9" : "size-8";
  if (image && !err) {
    return (
      <img src={image} alt={initials} referrerPolicy="no-referrer" onError={() => setErr(true)}
        className={`${cls} rounded-full object-cover border border-border/40 shrink-0`} />
    );
  }
  return (
    <div className={`${cls} rounded-full bg-secondary flex items-center justify-center border border-border/40 shrink-0`}>
      <span className="text-[10px] font-bold text-foreground">{initials}</span>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: any;
  label: string;
  value: string | number;
  sub?: string;
  accent?: string;
}) {
  return (
    <div className="bg-card border border-border/50 rounded-2xl p-5 flex flex-col gap-3 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold tracking-widest text-muted-foreground/60 uppercase">{label}</p>
        <div className={`size-8 rounded-xl flex items-center justify-center ${accent ?? "bg-secondary/60"}`}>
          <Icon className="size-4 text-muted-foreground" />
        </div>
      </div>
      <div>
        <p className="text-3xl font-bold text-foreground tracking-tight">{value}</p>
        {sub && <p className="text-[11px] text-muted-foreground/50 mt-1">{sub}</p>}
      </div>
    </div>
  );
}

function LimitBadge({ limit }: { limit: number }) {
  if (limit === -1) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
        <RiInfinityLine className="size-3" /> Unlimited
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-secondary text-muted-foreground border border-border/40">
      {limit}/day
    </span>
  );
}

function timeAgo(iso: string | null): string {
  if (!iso) return "Never";
  const diff = Date.now() - new Date(iso).getTime();
  const d = Math.floor(diff / 86400000);
  const h = Math.floor(diff / 3600000);
  const m = Math.floor(diff / 60000);
  if (d > 0) return `${d}d ago`;
  if (h > 0) return `${h}h ago`;
  if (m > 0) return `${m}m ago`;
  return "Just now";
}

const CHART_COLORS = {
  inbox_summary: "#6366f1",
  email_draft: "#8b5cf6",
  calendar_event: "#06b6d4",
  general: "#64748b",
};

const CustomTooltipBar = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border/50 rounded-xl px-3.5 py-2.5 shadow-xl text-xs">
      <p className="text-muted-foreground mb-1 font-mono">{label}</p>
      <p className="font-semibold text-foreground">{payload[0].value} requests</p>
    </div>
  );
};

const CustomTooltipPie = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border/50 rounded-xl px-3.5 py-2.5 shadow-xl text-xs">
      <p className="font-semibold text-foreground">{payload[0].name}</p>
      <p className="text-muted-foreground">{payload[0].value} credits</p>
    </div>
  );
};

export default function AdminContent({ currentUser }: { currentUser: { name?: string | null; email?: string | null; image?: string | null } }) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Edit limit dialog
  const [editUser, setEditUser] = useState<UserRow | null>(null);
  const [editLimit, setEditLimit] = useState<string>("10");
  const [editSaving, setEditSaving] = useState(false);
  const [editSuccess, setEditSuccess] = useState(false);

  // Add user dialog
  const [showAdd, setShowAdd] = useState(false);
  const [addName, setAddName] = useState("");
  const [addEmail, setAddEmail] = useState("");
  const [addLimit, setAddLimit] = useState("10");
  const [addSaving, setAddSaving] = useState(false);
  const [addError, setAddError] = useState("");

  // Delete confirm dialog
  const [deleteUser, setDeleteUser] = useState<UserRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [s, u, a] = await Promise.all([
      fetch("/api/admin/stats").then((r) => r.json()).catch(() => null),
      fetch("/api/admin/users").then((r) => r.json()).catch(() => []),
      fetch("/api/admin/analytics").then((r) => r.ok ? r.json() : null).catch(() => null),
    ]);
    setStats(s?.totalUsers !== undefined ? s : null);
    setUsers(Array.isArray(u) ? u : []);
    setAnalytics(a?.dailyChart ? a : null);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()),
  );

  const openEdit = (u: UserRow) => {
    setEditUser(u);
    setEditLimit(u.effectiveLimit === -1 ? "-1" : String(u.effectiveLimit));
    setEditSuccess(false);
  };

  const saveLimit = async () => {
    if (!editUser) return;
    setEditSaving(true);
    const aiDailyLimit = editLimit === "-1" ? -1 : parseInt(editLimit, 10);
    await fetch(`/api/admin/users/${editUser.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ aiDailyLimit }),
    });
    setEditSaving(false);
    setEditSuccess(true);
    await load();
    setTimeout(() => { setEditUser(null); setEditSuccess(false); }, 800);
  };

  const addUser = async () => {
    setAddSaving(true);
    setAddError("");
    const aiDailyLimit = addLimit === "-1" ? -1 : parseInt(addLimit, 10);
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: addName, email: addEmail, aiDailyLimit }),
    });
    if (!res.ok) {
      const d = await res.json();
      setAddError(d.error ?? "Failed");
    } else {
      setShowAdd(false);
      setAddName(""); setAddEmail(""); setAddLimit("10");
      await load();
    }
    setAddSaving(false);
  };

  const confirmDelete = async () => {
    if (!deleteUser) return;
    setDeleting(true);
    await fetch(`/api/admin/users/${deleteUser.id}`, { method: "DELETE" });
    setDeleting(false);
    setDeleteUser(null);
    await load();
  };

  const totalCategories = analytics
    ? Object.values(analytics.categoryTotals).reduce((a, b) => a + b, 0)
    : 0;

  return (
    <div className="flex h-screen overflow-hidden bg-background font-sans">
      <Sidebar user={currentUser} />

      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="h-16 px-7 flex items-center justify-between border-b border-border/40 bg-card/60 backdrop-blur-sm shrink-0">
          <div className="flex items-center gap-3">
            <div className="size-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <RiShieldLine className="size-4 text-primary" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-foreground tracking-tight">Admin Dashboard</h1>
              <p className="text-[10px] text-muted-foreground/50">User management & analytics</p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={() => setShowAdd(true)}
            className="gap-1.5 h-8 text-xs font-semibold rounded-xl cursor-pointer"
          >
            <RiAddLine className="size-3.5" />
            Add User
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 md:p-6 space-y-6">

          {/* ── Stat Cards ── */}
          {loading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-card border border-border/50 rounded-2xl p-5 h-28 animate-pulse" />
              ))}
            </div>
          ) : stats ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard icon={RiUserLine} label="Total Users" value={stats.totalUsers} sub="Registered accounts" accent="bg-indigo-500/10 border border-indigo-500/20" />
              <StatCard icon={RiSparkling2Line} label="AI Credits Today" value={stats.aiRequestsToday} sub="Across all users" accent="bg-violet-500/10 border border-violet-500/20" />
              <StatCard icon={RiBarChartLine} label="AI Credits / Month" value={stats.aiRequestsThisMonth} sub="Total monthly usage" accent="bg-cyan-500/10 border border-cyan-500/20" />
              <StatCard icon={RiMailLine} label="Gmail / Calendar"
                value={`${stats.gmailConnected} / ${stats.calendarConnected}`}
                sub="Connected integrations" accent="bg-emerald-500/10 border border-emerald-500/20" />
            </div>
          ) : null}

          {/* ── Analytics Charts ── */}
          {loading ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2 bg-card border border-border/50 rounded-2xl p-6 h-64 animate-pulse" />
              <div className="bg-card border border-border/50 rounded-2xl p-6 h-64 animate-pulse" />
            </div>
          ) : analytics ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

              {/* Daily AI Usage Bar Chart */}
              <div className="lg:col-span-2 bg-card border border-border/50 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <p className="text-sm font-bold text-foreground">Daily AI Credits</p>
                    <p className="text-[11px] text-muted-foreground/50 mt-0.5">Last 14 days across all users</p>
                  </div>
                  <div className="size-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                    <RiBarChartLine className="size-4 text-indigo-500" />
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={analytics.dailyChart} barSize={18}>
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 9, fill: "var(--muted-foreground)", opacity: 0.5 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 9, fill: "var(--muted-foreground)", opacity: 0.5 }}
                      axisLine={false}
                      tickLine={false}
                      width={24}
                      allowDecimals={false}
                    />
                    <Tooltip content={<CustomTooltipBar />} cursor={{ fill: "rgba(99,102,241,0.05)", radius: 6 }} />
                    <Bar dataKey="requests" fill="#6366f1" radius={[5, 5, 0, 0]} opacity={0.85} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Category Donut Chart */}
              <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm font-bold text-foreground">Credit Breakdown</p>
                    <p className="text-[11px] text-muted-foreground/50 mt-0.5">All users · all time</p>
                  </div>
                  <div className="size-8 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                    <RiSparkling2Line className="size-4 text-violet-500" />
                  </div>
                </div>

                {totalCategories === 0 ? (
                  <div className="flex-1 flex items-center justify-center text-[11px] text-muted-foreground/40">
                    No data yet
                  </div>
                ) : (
                  <>
                    <ResponsiveContainer width="100%" height={140}>
                      <PieChart>
                        <Pie
                          data={analytics.categoryChart.filter((c) => c.value > 0)}
                          cx="50%"
                          cy="50%"
                          innerRadius={42}
                          outerRadius={62}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {analytics.categoryChart
                            .filter((c) => c.value > 0)
                            .map((entry, i) => (
                              <Cell key={i} fill={entry.color} />
                            ))}
                        </Pie>
                        <Tooltip content={<CustomTooltipPie />} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="mt-3 space-y-2">
                      {analytics.categoryChart.map((cat) => (
                        <div key={cat.name} className="flex items-center justify-between text-[11px]">
                          <div className="flex items-center gap-2">
                            <span className="size-2 rounded-full shrink-0" style={{ background: cat.color }} />
                            <span className="text-muted-foreground">{cat.name}</span>
                          </div>
                          <span className="font-semibold text-foreground tabular-nums">
                            {cat.value}
                            <span className="text-muted-foreground/40 font-normal ml-1">
                              ({totalCategories > 0 ? Math.round((cat.value / totalCategories) * 100) : 0}%)
                            </span>
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          ) : null}

          {/* ── Top Users by AI Credits ── */}
          {!loading && analytics && analytics.topUsers.length > 0 && (
            <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <p className="text-sm font-bold text-foreground">Top Users by AI Credits</p>
                  <p className="text-[11px] text-muted-foreground/50 mt-0.5">This month — breakdown by what they use credits for</p>
                </div>
                <div className="size-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                  <RiUserLine className="size-4 text-cyan-500" />
                </div>
              </div>

              <div className="space-y-3">
                {analytics.topUsers.map((u, idx) => {
                  const max = analytics.topUsers[0]?.total ?? 1;
                  const pct = Math.round((u.total / max) * 100);
                  const cats = [
                    { key: "inbox_summary", color: CHART_COLORS.inbox_summary, label: "Inbox", val: u.inbox_summary },
                    { key: "email_draft", color: CHART_COLORS.email_draft, label: "Drafts", val: u.email_draft },
                    { key: "calendar_event", color: CHART_COLORS.calendar_event, label: "Calendar", val: u.calendar_event },
                    { key: "general", color: CHART_COLORS.general, label: "General", val: u.general },
                  ].filter((c) => c.val > 0);

                  return (
                    <div key={u.id} className="flex items-center gap-4 py-2.5 px-3 rounded-xl hover:bg-secondary/30 transition-colors">
                      {/* Rank */}
                      <span className="text-[11px] font-bold text-muted-foreground/30 w-4 shrink-0 tabular-nums">
                        {idx + 1}
                      </span>
                      <Avatar name={u.name} image={u.image} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-foreground truncate">{u.name}</p>
                            <p className="text-[10px] text-muted-foreground/50 truncate font-mono">{u.email}</p>
                          </div>
                          <span className="text-xs font-bold text-foreground tabular-nums ml-3 shrink-0">
                            {u.total} <span className="text-muted-foreground/40 font-normal text-[10px]">credits</span>
                          </span>
                        </div>
                        {/* Segmented bar */}
                        <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden flex">
                          {u.total > 0 && cats.map((cat) => (
                            <div
                              key={cat.key}
                              className="h-full transition-all"
                              style={{
                                width: `${(cat.val / u.total) * pct}%`,
                                background: cat.color,
                              }}
                              title={`${cat.label}: ${cat.val}`}
                            />
                          ))}
                        </div>
                        {cats.length > 0 && (
                          <div className="flex gap-3 mt-1.5">
                            {cats.map((cat) => (
                              <span key={cat.key} className="flex items-center gap-1 text-[9px] text-muted-foreground/50">
                                <span className="size-1.5 rounded-full" style={{ background: cat.color }} />
                                {cat.label} ({cat.val})
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Users Table ── */}
          <div className="bg-card border border-border/50 rounded-2xl overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-border/40 flex items-center justify-between gap-4">
              <h2 className="text-sm font-bold text-foreground">All Users</h2>
              <div className="relative">
                <RiSearchLine className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground/40" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name or email…"
                  className="h-8 w-64 text-xs bg-secondary/40 border border-border/40 rounded-xl pl-8 pr-3 outline-none focus:border-foreground/30 text-foreground placeholder:text-muted-foreground/40 transition-colors"
                />
              </div>
            </div>

            {loading ? (
              <div className="divide-y divide-border/20">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="px-6 py-4 flex items-center gap-4 animate-pulse">
                    <div className="size-8 rounded-full bg-secondary" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 w-32 bg-secondary rounded" />
                      <div className="h-2.5 w-48 bg-secondary/60 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="px-6 py-12 text-center text-xs text-muted-foreground/50">No users found.</div>
            ) : (
              <div className="overflow-x-auto">
              <div className="min-w-180 divide-y divide-border/20">
                {/* Table header */}
                <div className="px-6 py-2.5 grid grid-cols-[1fr_80px_80px_110px_100px_100px_80px] gap-4 items-center bg-secondary/20">
                  {["User", "Gmail", "Calendar", "AI Today", "AI Month", "Rate Limit", "Actions"].map((h) => (
                    <p key={h} className="text-[9px] font-bold tracking-widest text-muted-foreground/40 uppercase">{h}</p>
                  ))}
                </div>

                {filteredUsers.map((u) => (
                  <div key={u.id} className="px-6 py-3.5 grid grid-cols-[1fr_80px_80px_110px_100px_100px_80px] gap-4 items-center hover:bg-secondary/20 transition-colors group">
                    {/* User */}
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar name={u.name} image={u.image} />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-foreground truncate">{u.name}</p>
                        <p className="text-[10px] text-muted-foreground/50 truncate font-mono">{u.email}</p>
                        <p className="text-[9px] text-muted-foreground/30 mt-0.5 flex items-center gap-1">
                          <RiTimeLine className="size-2.5 shrink-0" />
                          {timeAgo(u.lastActive)}
                        </p>
                      </div>
                    </div>

                    {/* Gmail */}
                    <div>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${u.gmailConnected ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20" : "bg-secondary text-muted-foreground/40 border-border/40"}`}>
                        {u.gmailConnected ? "✓ On" : "—"}
                      </span>
                    </div>

                    {/* Calendar */}
                    <div>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${u.calendarConnected ? "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20" : "bg-secondary text-muted-foreground/40 border-border/40"}`}>
                        {u.calendarConnected ? "✓ On" : "—"}
                      </span>
                    </div>

                    {/* AI Today */}
                    <div>
                      <p className="text-xs font-semibold text-foreground">
                        {u.aiToday}
                        {u.effectiveLimit !== -1 && (
                          <span className="text-muted-foreground/40 font-normal">/{u.effectiveLimit}</span>
                        )}
                      </p>
                      {u.effectiveLimit !== -1 && (
                        <div className="mt-1 h-1 w-16 rounded-full bg-secondary overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${Math.min(100, (u.aiToday / u.effectiveLimit) * 100)}%`,
                              background: u.aiToday / u.effectiveLimit > 0.8 ? "#f43f5e" : "#6366f1",
                            }}
                          />
                        </div>
                      )}
                    </div>

                    {/* AI Month */}
                    <p className="text-xs text-foreground font-semibold">{u.aiThisMonth}</p>

                    {/* Rate Limit */}
                    <LimitBadge limit={u.effectiveLimit} />

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => openEdit(u)}
                        className="size-7 rounded-lg flex items-center justify-center hover:bg-secondary border border-transparent hover:border-border/40 transition-all cursor-pointer"
                        title="Edit rate limit"
                      >
                        <RiEditLine className="size-3.5 text-muted-foreground" />
                      </button>
                      <button
                        onClick={() => setDeleteUser(u)}
                        className="size-7 rounded-lg flex items-center justify-center hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all cursor-pointer"
                        title="Delete user"
                      >
                        <RiDeleteBinLine className="size-3.5 text-muted-foreground hover:text-rose-500" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Edit Limit Dialog */}
      <Dialog open={!!editUser} onOpenChange={(o) => { if (!o) setEditUser(null); }}>
        <DialogContent className="max-w-sm" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>Set Rate Limit</DialogTitle>
          </DialogHeader>
          {editUser && (
            <div className="space-y-4 py-1">
              <div className="flex items-center gap-3 p-3 bg-secondary/40 rounded-xl border border-border/40">
                <Avatar name={editUser.name} image={editUser.image} />
                <div>
                  <p className="text-xs font-semibold text-foreground">{editUser.name}</p>
                  <p className="text-[10px] text-muted-foreground/60 font-mono">{editUser.email}</p>
                </div>
              </div>
              <div className="space-y-3">
                <p className="text-[10px] font-bold tracking-widest text-muted-foreground/60 uppercase">Daily AI Request Limit</p>
                <div className="grid grid-cols-3 gap-2">
                  {[["5", "5/day"], ["10", "10/day"], ["25", "25/day"], ["50", "50/day"], ["100", "100/day"], ["-1", "Unlimited"]].map(([val, label]) => (
                    <button
                      key={val}
                      onClick={() => setEditLimit(val)}
                      className={`h-9 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${editLimit === val ? "bg-primary text-primary-foreground border-primary" : "bg-secondary/40 text-muted-foreground border-border/40 hover:border-foreground/30 hover:text-foreground"}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground/60">Custom:</span>
                  <input
                    type="number"
                    value={editLimit}
                    onChange={(e) => setEditLimit(e.target.value)}
                    min={-1}
                    className="flex-1 h-8 text-xs bg-secondary/40 border border-border/40 rounded-xl px-3 outline-none focus:border-foreground/30 text-foreground transition-colors"
                    placeholder="-1 for unlimited"
                  />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setEditUser(null)} className="cursor-pointer">Cancel</Button>
            <Button size="sm" onClick={saveLimit} disabled={editSaving || editSuccess} className="gap-1.5 cursor-pointer">
              {editSuccess ? <><RiCheckLine className="size-3.5" /> Saved</> : editSaving ? <><RiLoader4Line className="size-3.5 animate-spin" /> Saving…</> : "Save Limit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add User Dialog */}
      <Dialog open={showAdd} onOpenChange={(o) => { if (!o) { setShowAdd(false); setAddError(""); } }}>
        <DialogContent className="max-w-sm" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>Add User</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-1">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold tracking-widest text-muted-foreground/60 uppercase">Full Name</label>
              <input
                value={addName}
                onChange={(e) => setAddName(e.target.value)}
                placeholder="Jane Doe"
                className="w-full h-9 text-xs bg-secondary/40 border border-border/40 rounded-xl px-3 outline-none focus:border-foreground/30 text-foreground placeholder:text-muted-foreground/40 transition-colors"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold tracking-widest text-muted-foreground/60 uppercase">Email Address</label>
              <input
                type="email"
                value={addEmail}
                onChange={(e) => setAddEmail(e.target.value)}
                placeholder="jane@example.com"
                className="w-full h-9 text-xs bg-secondary/40 border border-border/40 rounded-lg px-3 outline-none focus:border-foreground/30 text-foreground placeholder:text-muted-foreground/40 transition-colors"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold tracking-widest text-muted-foreground/60 uppercase">Daily AI Limit</label>
              <div className="grid grid-cols-3 gap-2">
                {[["10", "10/day"], ["25", "25/day"], ["-1", "Unlimited"]].map(([val, label]) => (
                  <button
                    key={val}
                    onClick={() => setAddLimit(val)}
                    className={`h-8 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${addLimit === val ? "bg-primary text-primary-foreground border-primary" : "bg-secondary/40 text-muted-foreground border-border/40 hover:border-foreground/30 hover:text-foreground"}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <input
                type="number"
                value={addLimit}
                onChange={(e) => setAddLimit(e.target.value)}
                min={-1}
                className="w-full h-9 text-xs bg-secondary/40 border border-border/40 rounded-xl px-3 outline-none focus:border-foreground/30 text-foreground transition-colors"
                placeholder="-1 for unlimited"
              />
            </div>
            {addError && <p className="text-xs text-destructive font-medium">{addError}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => { setShowAdd(false); setAddError(""); }} className="cursor-pointer">Cancel</Button>
            <Button size="sm" onClick={addUser} disabled={addSaving || !addName.trim() || !addEmail.trim()} className="gap-1.5 cursor-pointer">
              {addSaving ? <><RiLoader4Line className="size-3.5 animate-spin" /> Adding…</> : <><RiAddLine className="size-3.5" /> Add User</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={!!deleteUser} onOpenChange={(o) => { if (!o) setDeleteUser(null); }}>
        <DialogContent className="max-w-sm" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
          </DialogHeader>
          <p className="text-xs text-muted-foreground py-1">
            This will permanently delete <span className="font-semibold text-foreground">{deleteUser?.name}</span> and all their data. This cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setDeleteUser(null)} className="cursor-pointer">Cancel</Button>
            <Button variant="destructive" size="sm" onClick={confirmDelete} disabled={deleting} className="gap-1.5 cursor-pointer">
              {deleting ? <><RiLoader4Line className="size-3.5 animate-spin" /> Deleting…</> : <><RiDeleteBinLine className="size-3.5" /> Delete</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

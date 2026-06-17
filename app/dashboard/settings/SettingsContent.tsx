"use client";

import { authClient } from "@/lib/auth-client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/lib/theme/ThemeProvider";
import Sidebar from "@/components/layout/Sidebar";
import TopNav from "@/components/layout/TopNav";
import SettingsOverlay from "@/components/layout/SettingsOverlay";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  RiSunLine,
  RiMoonLine,
  RiComputerLine,
  RiGoogleFill,
  RiCalendarLine,
  RiRefreshLine,
  RiLoaderLine,
  RiRobot2Line,
  RiLogoutBoxLine,
  RiCheckLine,
  RiWifiOffLine,
  RiFlashlightLine,
  RiVipCrownLine,
  RiArrowUpLine,
  RiMailLine,
  RiSparklingLine,
  RiKeyboardLine,
  RiBrainLine,
  RiDeleteBinLine,
  RiCloseLine,
} from "@remixicon/react";

interface SettingsContentProps {
  user: { name?: string | null; email?: string | null; image?: string | null } | null;
  gmailConnected: boolean;
  calendarConnected: boolean;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-bold text-muted-foreground/50 uppercase tracking-widest mb-3 px-0.5">
      {children}
    </p>
  );
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-card border border-border rounded-xl overflow-hidden shadow-sm dark:shadow-black/20 ${className}`}>
      {children}
    </div>
  );
}

function Row({ children, last = false }: { children: React.ReactNode; last?: boolean }) {
  return (
    <div className={`px-5 py-4 flex items-center justify-between gap-4 ${last ? "" : "border-b border-border/50"}`}>
      {children}
    </div>
  );
}

function ConnectedBadge({ connected }: { connected: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border leading-none ${
      connected
        ? "bg-emerald-500/12 text-emerald-500 border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20"
        : "bg-secondary text-muted-foreground/70 border-border/60"
    }`}>
      <span className={`size-1.5 rounded-full ${connected ? "bg-emerald-500" : "bg-muted-foreground/40"}`} />
      {connected ? "Connected" : "Not connected"}
    </span>
  );
}

export default function SettingsContent({ user, gmailConnected, calendarConnected }: SettingsContentProps) {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [resettingTour, setResettingTour] = useState(false);
  const [tourReset, setTourReset] = useState(false);
  const [disconnecting, setDisconnecting] = useState<"gmail" | "calendar" | null>(null);
  const [aiUsage, setAiUsage] = useState<{ count: number; limit: number; unlimited: boolean; aiAccess?: boolean; role?: string } | null>(null);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showMemory, setShowMemory] = useState(false);
  const [memories, setMemories] = useState<{ id: string; content: string; createdAt: string | null }[]>([]);
  const [memoriesLoading, setMemoriesLoading] = useState(false);
  const [memoryEnabled, setMemoryEnabled] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    fetch("/api/ai/usage").then((r) => r.json()).then(setAiUsage).catch(() => {});
  }, []);

  const handleSignOut = async () => {
    setSigningOut(true);
    await authClient.signOut();
    router.push("/");
  };

  const handleDisconnect = async (service: "gmail" | "calendar") => {
    setDisconnecting(service);
    try {
      await fetch(service === "gmail" ? "/api/gmail/disconnect" : "/api/calendar/disconnect", { method: "POST" });
      window.location.href = "/dashboard";
    } finally {
      setDisconnecting(null);
    }
  };

  const loadMemories = async () => {
    setMemoriesLoading(true);
    try {
      const res = await fetch("/api/ai/memory");
      const data = await res.json();
      setMemories(data.memories ?? []);
      setMemoryEnabled(data.enabled ?? false);
    } finally {
      setMemoriesLoading(false);
    }
  };

  const handleDeleteMemory = async (id: string) => {
    setDeletingId(id);
    try {
      await fetch("/api/ai/memory", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      setMemories((prev) => prev.filter((m) => m.id !== id));
    } finally {
      setDeletingId(null);
    }
  };

  const handleResetTour = async () => {
    setResettingTour(true);
    try {
      await fetch("/api/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hasSeenTour: false }),
      });
      setTourReset(true);
      setTimeout(() => { window.location.href = "/dashboard"; }, 700);
    } finally {
      setResettingTour(false);
    }
  };

  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() ?? "?";

  const hasAiAccess = aiUsage?.aiAccess !== false;
  const isPro = aiUsage?.unlimited === true;
  const aiPct = aiUsage && !aiUsage.unlimited ? Math.min((aiUsage.count / aiUsage.limit) * 100, 100) : 0;
  const aiStatusKey = !aiUsage ? null
    : aiUsage.unlimited ? "unlimited"
    : aiUsage.count >= aiUsage.limit ? "exhausted"
    : aiUsage.count >= aiUsage.limit * 0.8 ? "warning"
    : "ok";

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar user={user} gmailConnected={gmailConnected} calendarConnected={calendarConnected} />

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <TopNav user={user} gmailConnected={gmailConnected} />

        <div className="flex-1 overflow-y-auto bg-background dark:bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(129,140,248,0.06),transparent)]">
          <div className="max-w-170 mx-auto px-6 py-10 space-y-8">

            {/* Page header */}
            <div className="pb-2">
              <h1 className="text-[26px] font-bold text-foreground tracking-tight leading-tight">Settings</h1>
              <p className="text-[13px] text-muted-foreground mt-1.5">Manage your account, appearance, and integrations.</p>
            </div>

            {/* ── Account ─────────────────────────────────────── */}
            <section className="space-y-3">
              <SectionLabel>Account</SectionLabel>
              <Card>
                <div className="px-5 py-5 flex items-center gap-4">
                  <div className="relative shrink-0">
                    {user?.image ? (
                      <img
                        src={user.image}
                        alt={user.name ?? "User"}
                        referrerPolicy="no-referrer"
                        className="size-14 rounded-full object-cover ring-2 ring-border/60 dark:ring-white/8 shadow-md"
                      />
                    ) : (
                      <div className="size-14 rounded-full bg-linear-to-br from-primary/30 to-primary/10 border border-primary/20 flex items-center justify-center shadow-md">
                        <span className="text-[17px] font-bold text-primary">{initials}</span>
                      </div>
                    )}
                    <span className="absolute bottom-0 right-0 size-3.5 rounded-full bg-emerald-500 border-2 border-card shadow-sm" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-[15px] font-semibold text-foreground leading-tight truncate">{user?.name ?? "Tsunagu User"}</p>
                    <p className="text-[12.5px] text-muted-foreground truncate mt-0.5">{user?.email}</p>
                    {/* Badge: only shown once aiUsage has loaded */}
                    {aiUsage && (
                      isPro ? (
                        <span className="inline-flex items-center gap-1.5 mt-2 text-[10px] font-bold px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 uppercase tracking-wider">
                          <RiVipCrownLine className="size-3" />
                          Pro Account
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 mt-2 text-[10px] font-bold px-2.5 py-1 rounded-full bg-secondary text-muted-foreground border border-border/60 uppercase tracking-wider">
                          Free Account
                        </span>
                      )
                    )}
                  </div>
                </div>
              </Card>
            </section>

            {/* ── Appearance ──────────────────────────────────── */}
            <section className="space-y-3">
              <SectionLabel>Appearance</SectionLabel>
              <Card>
                <div className="px-5 py-5 space-y-4">
                  <div>
                    <p className="text-[13.5px] font-semibold text-foreground">Theme</p>
                    <p className="text-[12px] text-muted-foreground mt-0.5">Choose how Tsunagu appears on your device.</p>
                  </div>
                  {mounted && (
                    <div className="grid grid-cols-3 gap-3">
                      {([
                        { key: "light",  label: "Light",  icon: RiSunLine,      preview: "bg-[#f8f9fc] border-[#e2e7f0]" },
                        { key: "dark",   label: "Dark",   icon: RiMoonLine,     preview: "bg-[#0c0c10] border-[rgba(255,255,255,0.07)]" },
                        { key: "system", label: "System", icon: RiComputerLine, preview: "bg-linear-to-br from-[#f8f9fc] to-[#0c0c10] border-border/50" },
                      ] as const).map(({ key, label, icon: Icon, preview }) => {
                        const active = theme === key;
                        return (
                          <button
                            key={key}
                            onClick={() => setTheme(key)}
                            className={`relative flex flex-col gap-3 p-4 rounded-xl border text-left transition-all duration-150 cursor-pointer focus:outline-none ${
                              active
                                ? "border-primary/40 bg-primary/6 dark:bg-primary/8 shadow-[0_0_0_1px_rgba(129,140,248,0.25)]"
                                : "border-border/60 bg-secondary/20 hover:bg-secondary/50 hover:border-border"
                            }`}
                          >
                            <div className={`h-8 w-full rounded-lg border ${preview}`} />
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Icon className={`size-3.5 ${active ? "text-primary" : "text-muted-foreground"}`} />
                                <span className={`text-[12px] font-semibold ${active ? "text-primary" : "text-muted-foreground"}`}>{label}</span>
                              </div>
                              {active && (
                                <span className="size-4 rounded-full bg-primary flex items-center justify-center shrink-0">
                                  <RiCheckLine className="size-2.5 text-primary-foreground" />
                                </span>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </Card>
            </section>

            {/* ── AI Credits ──────────────────────────────────── */}
            {aiUsage && (
              <section className="space-y-3">
                <SectionLabel>AI Assistant</SectionLabel>
                <Card>
                  {!hasAiAccess ? (
                    /* No access state */
                    <div className="px-5 py-5 flex items-start gap-3.5">
                      <div className="size-10 rounded-xl bg-secondary border border-border/60 flex items-center justify-center shrink-0">
                        <RiRobot2Line className="size-5 text-muted-foreground/40" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-[13.5px] font-semibold text-foreground">Tsunagu AI</p>
                          <span className="shrink-0 text-[11px] font-semibold px-2.5 py-1 rounded-full border leading-none bg-secondary text-muted-foreground/60 border-border/50">
                            No Access
                          </span>
                        </div>
                        <p className="text-[12px] text-muted-foreground mt-0.5">
                          AI features are not enabled for your account. Contact your admin to request access.
                        </p>
                        <a
                          href="mailto:dhruvsood1102@gmail.com?subject=Tsunagu AI Access Request"
                          className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-1.5 text-[12px] font-semibold bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shadow-sm transition-all cursor-pointer"
                        >
                          <RiMailLine className="size-3.5" />
                          Request Access
                        </a>
                      </div>
                    </div>
                  ) : (
                    /* Has access state */
                    <div className="px-5 py-5 space-y-4">
                      <div className="flex items-start gap-3.5">
                        <div className="size-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                          <RiRobot2Line className="size-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-[13.5px] font-semibold text-foreground">Daily AI Requests</p>
                            {!aiUsage.unlimited && (
                              <span className={`shrink-0 text-[11px] font-semibold px-2.5 py-1 rounded-full border leading-none ${
                                aiStatusKey === "exhausted"
                                  ? "bg-rose-500/12 text-rose-500 border-rose-500/25 dark:bg-rose-500/10 dark:border-rose-500/20"
                                  : aiStatusKey === "warning"
                                  ? "bg-amber-500/12 text-amber-500 border-amber-500/25 dark:bg-amber-500/10 dark:border-amber-500/20"
                                  : "bg-emerald-500/12 text-emerald-600 dark:text-emerald-400 border-emerald-500/25 dark:border-emerald-500/20"
                              }`}>
                                {aiStatusKey === "exhausted" ? "Limit reached" : aiStatusKey === "warning" ? "Almost full" : "Active"}
                              </span>
                            )}
                          </div>
                          <p className="text-[12px] text-muted-foreground mt-0.5">
                            {aiUsage.unlimited
                              ? `Unlimited access${isPro ? " — Pro plan" : ""}.`
                              : `${aiUsage.count} of ${aiUsage.limit} requests used today`}
                          </p>
                        </div>
                      </div>

                      {!aiUsage.unlimited && (
                        <div className="space-y-1.5">
                          <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-700 ${
                                aiStatusKey === "exhausted" ? "bg-rose-500"
                                : aiStatusKey === "warning" ? "bg-amber-500"
                                : "bg-primary"
                              }`}
                              style={{ width: `${aiPct}%` }}
                            />
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-[11px] text-muted-foreground/60">Resets daily at midnight IST</span>
                            <span className="text-[11px] font-mono font-medium text-muted-foreground">
                              {Math.max(aiUsage.limit - aiUsage.count, 0)} remaining
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              </section>
            )}

            {/* ── AI Memory ───────────────────────────────────── */}
            <section className="space-y-3">
              <SectionLabel>AI Memory</SectionLabel>
              <Card>
                <div className="px-5 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-3.5">
                    <div className="size-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                      <RiBrainLine className="size-4.5 text-primary" />
                    </div>
                    <div>
                      <p className="text-[13.5px] font-semibold text-foreground">Long-term Memory</p>
                      <p className="text-[12px] text-muted-foreground mt-0.5">
                        {memoryEnabled ? "AI remembers context from past conversations" : "Supermemory not configured"}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => { setShowMemory(true); loadMemories(); }}
                    className="flex items-center gap-2 px-4 py-2 text-[12px] font-semibold text-foreground bg-secondary hover:bg-secondary/80 border border-border/60 rounded-xl transition-all cursor-pointer shrink-0"
                  >
                    <RiBrainLine className="size-3.5" />
                    View Memory
                  </button>
                </div>
              </Card>
            </section>

            {/* ── Integrations ────────────────────────────────── */}
            <section className="space-y-3">
              <SectionLabel>Integrations</SectionLabel>
              <div className="grid grid-cols-2 gap-3">

                {/* Gmail */}
                <Card>
                  <div className="px-4 pt-4 pb-4 space-y-3.5 flex flex-col h-full">
                    <div className="flex items-start gap-3">
                      <div className="size-9 rounded-xl bg-linear-to-br from-[#ea4335]/20 to-[#ea4335]/8 border border-[#ea4335]/20 dark:border-[#ea4335]/15 flex items-center justify-center shrink-0 shadow-sm">
                        <RiGoogleFill className="size-4 text-[#ea4335]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-foreground leading-tight">Gmail</p>
                        <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">Read, send & manage emails</p>
                      </div>
                    </div>

                    <ConnectedBadge connected={gmailConnected} />

                    {gmailConnected ? (
                      <button
                        onClick={() => handleDisconnect("gmail")}
                        disabled={!!disconnecting}
                        className="mt-auto w-full flex items-center justify-center gap-1.5 py-2 text-[12px] font-semibold text-rose-500 dark:text-rose-400 border border-rose-500/25 dark:border-rose-500/20 rounded-xl hover:bg-rose-500/6 dark:hover:bg-rose-500/8 transition-all disabled:opacity-40 cursor-pointer"
                      >
                        {disconnecting === "gmail"
                          ? <><RiLoaderLine className="size-3.5 animate-spin" /> Disconnecting…</>
                          : <><RiWifiOffLine className="size-3.5" /> Disconnect</>}
                      </button>
                    ) : (
                      <button
                        onClick={() => { window.location.href = "/api/connect?plugin=gmail"; }}
                        className="mt-auto w-full flex items-center justify-center gap-1.5 py-2 text-[12px] font-semibold bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shadow-sm shadow-primary/20 transition-all cursor-pointer"
                      >
                        <RiGoogleFill className="size-3.5" />
                        Connect Gmail
                      </button>
                    )}
                  </div>
                </Card>

                {/* Google Calendar */}
                <Card>
                  <div className="px-4 pt-4 pb-4 space-y-3.5 flex flex-col h-full">
                    <div className="flex items-start gap-3">
                      <div className="size-9 rounded-xl bg-linear-to-br from-[#4285f4]/20 to-[#4285f4]/8 border border-[#4285f4]/20 dark:border-[#4285f4]/15 flex items-center justify-center shrink-0 shadow-sm">
                        <RiCalendarLine className="size-4 text-[#4285f4]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-foreground leading-tight">Calendar</p>
                        <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">Sync events & schedule</p>
                      </div>
                    </div>

                    <ConnectedBadge connected={calendarConnected} />

                    {calendarConnected ? (
                      <button
                        onClick={() => handleDisconnect("calendar")}
                        disabled={!!disconnecting}
                        className="mt-auto w-full flex items-center justify-center gap-1.5 py-2 text-[12px] font-semibold text-rose-500 dark:text-rose-400 border border-rose-500/25 dark:border-rose-500/20 rounded-xl hover:bg-rose-500/6 dark:hover:bg-rose-500/8 transition-all disabled:opacity-40 cursor-pointer"
                      >
                        {disconnecting === "calendar"
                          ? <><RiLoaderLine className="size-3.5 animate-spin" /> Disconnecting…</>
                          : <><RiWifiOffLine className="size-3.5" /> Disconnect</>}
                      </button>
                    ) : (
                      <button
                        onClick={() => { window.location.href = "/api/connect?plugin=googlecalendar"; }}
                        className="mt-auto w-full flex items-center justify-center gap-1.5 py-2 text-[12px] font-semibold bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shadow-sm shadow-primary/20 transition-all cursor-pointer"
                      >
                        <RiCalendarLine className="size-3.5" />
                        Connect Calendar
                      </button>
                    )}
                  </div>
                </Card>
              </div>
            </section>

            {/* ── Keyboard Shortcuts ──────────────────────────── */}
            <section className="space-y-3">
              <SectionLabel>Keyboard Shortcuts</SectionLabel>
              <Card>
                <div className="px-5 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-3.5">
                    <div className="size-10 rounded-xl bg-secondary border border-border/60 flex items-center justify-center shrink-0">
                      <RiKeyboardLine className="size-4.5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-[13.5px] font-semibold text-foreground">Keyboard Shortcuts</p>
                      <p className="text-[12px] text-muted-foreground mt-0.5">View all keyboard bindings for Tsunagu</p>
                    </div>
                  </div>
                  <Dialog open={showShortcuts} onOpenChange={setShowShortcuts}>
                    <button
                      onClick={() => setShowShortcuts(true)}
                      className="flex items-center gap-2 px-4 py-2 text-[12px] font-semibold text-foreground bg-secondary hover:bg-secondary/80 border border-border/60 rounded-xl transition-all cursor-pointer shrink-0"
                    >
                      <RiKeyboardLine className="size-3.5" />
                      View Shortcuts
                    </button>
                    <DialogContent className="max-w-md" aria-describedby={undefined}>
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <RiKeyboardLine className="size-4 text-primary" />
                          Keyboard Shortcuts
                        </DialogTitle>
                      </DialogHeader>

                      <div className="space-y-5 py-1">
                        {([
                          {
                            label: "AI Chat",
                            shortcuts: [
                              { keys: ["Enter"], desc: "Send message" },
                              { keys: ["Shift", "Enter"], desc: "New line in message" },
                              { keys: ["Ctrl", "K"], desc: "New chat session" },
                              { keys: ["Esc"], desc: "Stop streaming response" },
                            ],
                          },
                          {
                            label: "Navigation",
                            shortcuts: [
                              { keys: ["Ctrl", "/"], desc: "Toggle chat history sidebar" },
                            ],
                          },
                        ] as const).map((group) => (
                          <div key={group.label} className="space-y-2">
                            <p className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest">{group.label}</p>
                            <div className="bg-secondary/30 border border-border/50 rounded-xl overflow-hidden divide-y divide-border/40">
                              {group.shortcuts.map(({ keys, desc }) => (
                                <div key={desc} className="flex items-center justify-between px-4 py-2.5">
                                  <span className="text-[12.5px] text-foreground">{desc}</span>
                                  <div className="flex items-center gap-1">
                                    {keys.map((k, i) => (
                                      <span key={i} className="inline-flex items-center">
                                        {i > 0 && <span className="text-[10px] text-muted-foreground/40 mx-0.5">+</span>}
                                        <kbd className="inline-flex items-center justify-center px-2 py-1 text-[10px] font-semibold text-foreground/70 bg-card border border-border/60 rounded-lg shadow-[0_1px_2px_rgba(0,0,0,0.06)] font-mono min-w-[28px]">
                                          {k}
                                        </kbd>
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}

                        <p className="text-[11px] text-muted-foreground/40 text-center">
                          Mac users: use ⌘ instead of Ctrl
                        </p>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </Card>
            </section>

            {/* ── Platform ────────────────────────────────────── */}
            <section className="space-y-3">
              <SectionLabel>Platform</SectionLabel>
              <Card>
                <Row last>
                  <div className="flex items-center gap-3.5">
                    <div className="size-10 rounded-xl bg-secondary border border-border/60 flex items-center justify-center shrink-0">
                      <RiFlashlightLine className="size-4.5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-[13.5px] font-semibold text-foreground">Walkthrough Tour</p>
                      <p className="text-[12px] text-muted-foreground mt-0.5">Replay the guided onboarding experience</p>
                    </div>
                  </div>
                  <button
                    onClick={handleResetTour}
                    disabled={resettingTour || tourReset}
                    className="flex items-center gap-2 px-4 py-2 text-[12px] font-semibold text-foreground bg-secondary hover:bg-secondary/80 border border-border/60 rounded-xl transition-all disabled:opacity-40 cursor-pointer shrink-0"
                  >
                    <RiRefreshLine className={`size-3.5 ${resettingTour ? "animate-spin" : ""}`} />
                    {tourReset ? "Reloading…" : resettingTour ? "Resetting…" : "Restart Tour"}
                  </button>
                </Row>
              </Card>
            </section>

            {/* ── Session ─────────────────────────────────────── */}
            <section className="space-y-3">
              <SectionLabel>Session</SectionLabel>
              <Card>
                <Row last>
                  <div className="flex items-center gap-3.5">
                    <div className="size-10 rounded-xl bg-rose-500/8 dark:bg-rose-500/6 border border-rose-500/15 flex items-center justify-center shrink-0">
                      <RiLogoutBoxLine className="size-4.5 text-rose-500/70 dark:text-rose-400/70" />
                    </div>
                    <div>
                      <p className="text-[13.5px] font-semibold text-foreground">Sign out</p>
                      <p className="text-[12px] text-muted-foreground mt-0.5">End your current Tsunagu session</p>
                    </div>
                  </div>
                  <button
                    onClick={handleSignOut}
                    disabled={signingOut}
                    className="flex items-center gap-2 px-4 py-2 text-[12px] font-semibold text-rose-500 dark:text-rose-400 bg-rose-500/8 dark:bg-rose-500/6 hover:bg-rose-500/14 dark:hover:bg-rose-500/12 border border-rose-500/20 dark:border-rose-500/15 rounded-xl transition-all disabled:opacity-40 cursor-pointer shrink-0"
                  >
                    {signingOut ? <RiLoaderLine className="size-3.5 animate-spin" /> : <RiLogoutBoxLine className="size-3.5" />}
                    {signingOut ? "Signing out…" : "Sign out"}
                  </button>
                </Row>
              </Card>
            </section>

            <div className="h-8" />
          </div>
        </div>
      </div>

      {/* ── Upgrade Dialog ──────────────────────────────────── */}
      <Dialog open={showUpgrade} onOpenChange={setShowUpgrade}>
        <DialogContent className="max-w-sm" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RiVipCrownLine className="size-4 text-primary" />
              Upgrade to Pro
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-1">
            {/* Pro benefits */}
            <div className="bg-primary/6 dark:bg-primary/8 border border-primary/20 rounded-xl p-4 space-y-2.5">
              {[
                { icon: RiSparklingLine, text: "Unlimited daily AI requests" },
                { icon: RiRobot2Line,    text: "Priority AI response speed" },
                { icon: RiVipCrownLine,  text: "Pro account badge" },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-2.5">
                  <div className="size-5 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                    <Icon className="size-3 text-primary" />
                  </div>
                  <span className="text-[12.5px] text-foreground font-medium">{text}</span>
                </div>
              ))}
            </div>

            {/* Contact admin message */}
            <div className="bg-secondary/50 border border-border/60 rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-2">
                <RiMailLine className="size-4 text-muted-foreground shrink-0" />
                <p className="text-[12.5px] font-semibold text-foreground">Payment gateway coming soon</p>
              </div>
              <p className="text-[12px] text-muted-foreground leading-relaxed">
                Online payments aren't live yet. To get Pro access, contact the admin directly and they'll upgrade your account manually.
              </p>
              <a
                href="mailto:dhruvsood1102@gmail.com?subject=Tsunagu Pro Upgrade Request"
                className="mt-2 w-full flex items-center justify-center gap-2 py-2.5 text-[12.5px] font-semibold bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shadow-sm shadow-primary/20 transition-all cursor-pointer"
              >
                <RiMailLine className="size-3.5" />
                Contact Admin
              </a>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <SettingsOverlay user={user} gmailConnected={gmailConnected} calendarConnected={calendarConnected} />

      {/* ── Memory Viewer Dialog ──────────────────────────── */}
      <Dialog open={showMemory} onOpenChange={setShowMemory}>
        <DialogContent className="max-w-lg max-h-[80vh] flex flex-col" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RiBrainLine className="size-4 text-primary" />
              AI Memory
              {memories.length > 0 && (
                <span className="ml-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                  {memories.length}
                </span>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-2 py-1 min-h-0">
            {memoriesLoading ? (
              <div className="flex items-center justify-center py-10 gap-2 text-muted-foreground">
                <RiLoaderLine className="size-4 animate-spin" />
                <span className="text-[13px]">Loading memories…</span>
              </div>
            ) : !memoryEnabled ? (
              <div className="py-10 text-center">
                <RiBrainLine className="size-8 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-[13px] font-medium text-muted-foreground">Supermemory not configured</p>
                <p className="text-[12px] text-muted-foreground/60 mt-1">Add SUPERMEMORY_API_KEY to enable memory.</p>
              </div>
            ) : memories.length === 0 ? (
              <div className="py-10 text-center">
                <RiBrainLine className="size-8 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-[13px] font-medium text-muted-foreground">No memories yet</p>
                <p className="text-[12px] text-muted-foreground/60 mt-1">Memories are saved as you chat with the AI.</p>
              </div>
            ) : (
              memories.map((m) => (
                <div
                  key={m.id}
                  className="group relative flex gap-3 p-3.5 rounded-xl border border-border/50 bg-secondary/20 hover:bg-secondary/40 transition-colors"
                >
                  <div className="size-6 rounded-lg bg-primary/10 border border-primary/15 flex items-center justify-center shrink-0 mt-0.5">
                    <RiBrainLine className="size-3.5 text-primary/70" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12.5px] text-foreground/90 leading-relaxed whitespace-pre-wrap wrap-break-word">
                      {m.content}
                    </p>
                    {m.createdAt && (
                      <p className="text-[10.5px] text-muted-foreground/50 mt-1.5">
                        {new Date(m.createdAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => handleDeleteMemory(m.id)}
                    disabled={deletingId === m.id}
                    className="shrink-0 opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-muted-foreground/40 hover:text-rose-500 hover:bg-rose-500/8 transition-all cursor-pointer disabled:opacity-30"
                  >
                    {deletingId === m.id
                      ? <RiLoaderLine className="size-3.5 animate-spin" />
                      : <RiDeleteBinLine className="size-3.5" />
                    }
                  </button>
                </div>
              ))
            )}
          </div>

          {memories.length > 0 && (
            <div className="pt-3 border-t border-border/50">
              <p className="text-[11px] text-muted-foreground/50 text-center">
                Hover a memory and click the trash icon to delete it
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

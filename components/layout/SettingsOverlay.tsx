"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useTheme } from "@/lib/theme/ThemeProvider";
import { Button } from "@/components/ui/button";
import {
  RiCloseLine,
  RiSettings3Line,
  RiSunLine,
  RiMoonLine,
  RiComputerLine,
  RiGoogleFill,
  RiCalendarLine,
  RiRefreshLine,
  RiLoaderLine,
  RiRobot2Line,
} from "@remixicon/react";
import { useEffect, useState } from "react";

interface SettingsOverlayProps {
  user?: { name?: string | null; email?: string | null; image?: string | null } | null;
  gmailConnected?: boolean;
  calendarConnected?: boolean;
}

export default function SettingsOverlay({
  user,
  gmailConnected = false,
  calendarConnected = false,
}: SettingsOverlayProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();

  const isOpen = searchParams.get("settings") === "true";

  const handleClose = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("settings");
    router.push(`${pathname}?${params.toString()}`);
  };

  const [mounted, setMounted] = useState(false);
  const [resettingTour, setResettingTour] = useState(false);
  const [tourReset, setTourReset] = useState(false);

  // AI usage state
  const [aiUsage, setAiUsage] = useState<{ count: number; limit: number; unlimited: boolean; hasOwnKey: boolean } | null>(null);


  useEffect(() => {
    setMounted(true);
    fetch("/api/ai/usage")
      .then((r) => r.json())
      .then((data) => setAiUsage(data))
      .catch(() => {});
  }, []);

  const handleResetTour = async () => {
    setResettingTour(true);
    try {
      await fetch("/api/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hasSeenTour: false }),
      });
      setTourReset(true);
      // Navigate to a clean /dashboard URL — drops the ?settings param so the
      // panel is closed on load, and re-fetches hasSeenTour=false so the tour fires.
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 700);
    } finally {
      setResettingTour(false);
    }
  };

  if (!isOpen || !mounted) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end font-sans">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={handleClose}
      />

      {/* Sheet Container */}
      <div className="relative w-full max-w-md bg-card border-l border-border/60 shadow-2xl h-full flex flex-col z-10 animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-border/40 shrink-0 bg-card/60 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <RiSettings3Line className="size-4.5 text-muted-foreground" />
            <h2 className="text-xl font-serif text-foreground tracking-tight">Settings</h2>
          </div>
          <button
            onClick={handleClose}
            className="size-7 flex items-center justify-center rounded-lg text-muted-foreground/60 hover:text-foreground hover:bg-secondary/80 transition-all cursor-pointer"
          >
            <RiCloseLine className="size-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Profile Card */}
          <div className="flex items-center gap-3.5 p-4 rounded-xl bg-secondary/30 border border-border/20">
            {user?.image ? (
              <img
                src={user.image}
                alt={user.name ?? "User"}
                className="size-11 rounded-full object-cover border border-border/40"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="size-11 rounded-full bg-secondary flex items-center justify-center border border-border/40 font-semibold text-sm">
                {user?.name?.[0]?.toUpperCase() ?? "?"}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-foreground truncate">{user?.name ?? "Tsunagu User"}</p>
              <p className="text-[11px] text-muted-foreground truncate">{user?.email}</p>
            </div>
          </div>

          {/* AI Usage Section */}
          {aiUsage && (
            <div className="space-y-3">
              <h3 className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest font-heading">AI Usage</h3>
              <div className="p-3.5 border border-border/45 rounded-lg bg-background space-y-3">
                <div className="flex items-start gap-2.5">
                  <div className="size-8 rounded bg-[#8b5cf6]/10 flex items-center justify-center shrink-0 mt-0.5">
                    <RiRobot2Line className="size-4 text-[#8b5cf6]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-foreground">Daily AI Requests</p>
                    {aiUsage.unlimited ? (
                      <p className="text-[10px] text-muted-foreground leading-relaxed mt-0.5">
                        Unlimited access
                      </p>
                    ) : (
                      <p className="text-[10px] text-muted-foreground leading-relaxed mt-0.5">
                        {aiUsage.count} of {aiUsage.limit} requests used today
                      </p>
                    )}
                  </div>
                  {!aiUsage.unlimited && (
                    <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full border shrink-0 ${
                      aiUsage.count >= aiUsage.limit
                        ? "bg-rose-500/10 text-rose-500 border-rose-500/20"
                        : aiUsage.count >= aiUsage.limit * 0.8
                        ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                        : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                    }`}>
                      {aiUsage.count >= aiUsage.limit ? "Limit Reached" : "Active"}
                    </span>
                  )}
                </div>

                {!aiUsage.unlimited && (
                  <>
                    {/* Progress bar */}
                    <div className="space-y-1.5">
                      <div className="h-1.5 w-full rounded-full bg-secondary/60 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            aiUsage.count >= aiUsage.limit
                              ? "bg-rose-500"
                              : aiUsage.count >= aiUsage.limit * 0.8
                              ? "bg-amber-500"
                              : "bg-[#8b5cf6]"
                          }`}
                          style={{ width: `${Math.min((aiUsage.count / aiUsage.limit) * 100, 100)}%` }}
                        />
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] text-muted-foreground/60">Resets daily at midnight IST</span>
                        <span className="text-[9px] font-mono text-muted-foreground">
                          {aiUsage.limit - aiUsage.count > 0 ? `${aiUsage.limit - aiUsage.count} left` : "0 left"}
                        </span>
                      </div>
                    </div>

                    {aiUsage.count >= aiUsage.limit && (
                      <p className="text-[10px] text-muted-foreground leading-relaxed bg-rose-500/5 border border-rose-500/10 rounded-md px-3 py-2">
                        You've reached your daily limit. Requests reset at midnight UTC.
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          <div className="border-t border-border/40" />

          {/* Theme Section */}
          <div className="space-y-3">
            <h3 className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest font-heading">Appearance</h3>
            <div className="grid grid-cols-3 gap-2">
              {[
                { key: "light", label: "Light", icon: RiSunLine },
                { key: "dark", label: "Dark", icon: RiMoonLine },
                { key: "system", label: "System", icon: RiComputerLine },
              ].map((opt) => {
                const Icon = opt.icon;
                const active = theme === opt.key;
                return (
                  <button
                    key={opt.key}
                    onClick={() => setTheme(opt.key as any)}
                    className={`flex flex-col items-center justify-center gap-2 p-3 rounded-lg border text-xs font-medium transition-all duration-150 cursor-pointer ${
                      active
                        ? "bg-secondary text-foreground border-foreground/30 shadow-inner"
                        : "bg-background text-muted-foreground border-border/40 hover:text-foreground hover:bg-secondary/40"
                    }`}
                  >
                    <Icon className="size-4.5" />
                    <span>{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="border-t border-border/40" />

          {/* Platform Tour Section */}
          <div className="space-y-3">
            <h3 className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest font-heading">Platform Tour</h3>
            <div className="flex items-center justify-between p-3 border border-border/45 rounded-lg bg-background">
              <div>
                <p className="text-xs font-bold text-foreground">Walkthrough Tour</p>
                <p className="text-[10px] text-muted-foreground">Replay the guided platform tour</p>
              </div>
              <button
                onClick={handleResetTour}
                disabled={resettingTour || tourReset}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-semibold text-muted-foreground hover:text-foreground bg-secondary/40 hover:bg-secondary/80 border border-border/30 rounded-lg transition-all disabled:opacity-50 cursor-pointer disabled:cursor-default"
              >
                <RiRefreshLine className={`size-3 ${resettingTour ? "animate-spin" : ""}`} />
                {tourReset ? "Reloading…" : resettingTour ? "Resetting…" : "Restart Tour"}
              </button>
            </div>
          </div>

          <div className="border-t border-border/40" />

          {/* Integrations Section */}
          <div className="space-y-3">
            <h3 className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest font-heading">Integrations</h3>
            <div className="space-y-2.5">
              {/* Gmail Connection */}
              <div className="flex items-center justify-between p-3 border border-border/45 rounded-lg bg-background">
                <div className="flex items-center gap-3">
                  <div className="size-8 rounded bg-[#ea4335]/10 flex items-center justify-center text-[#ea4335]">
                    <RiGoogleFill className="size-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-foreground">Gmail Inbox</p>
                    <p className="text-[10px] text-muted-foreground">Manage messages and replies</p>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wider uppercase border ${
                  gmailConnected
                    ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                    : "bg-muted text-muted-foreground border-border/40"
                }`}>
                  {gmailConnected ? "Active" : "Linked"}
                </span>
              </div>

              {/* Google Calendar Connection */}
              <div className="flex items-center justify-between p-3 border border-border/45 rounded-lg bg-background">
                <div className="flex items-center gap-3">
                  <div className="size-8 rounded bg-[#4285f4]/10 flex items-center justify-center text-[#4285f4]">
                    <RiCalendarLine className="size-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-foreground">Google Calendar</p>
                    <p className="text-[10px] text-muted-foreground">Sync meetings and schedules</p>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wider uppercase border ${
                  calendarConnected
                    ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                    : "bg-muted text-muted-foreground border-border/40"
                }`}>
                  {calendarConnected ? "Active" : "Linked"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border/40 bg-secondary/15 shrink-0 flex justify-end">
          <Button onClick={handleClose} className="h-9 px-4.5 rounded-lg text-xs font-semibold cursor-pointer">
            Close Settings
          </Button>
        </div>
      </div>
    </div>
  );
}

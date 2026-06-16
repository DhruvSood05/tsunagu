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
  RiKeyLine,
  RiEyeLine,
  RiEyeOffLine,
  RiCheckLine,
  RiDeleteBinLine,
  RiLoaderLine,
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

  // AI API key state
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [savedKeyHint, setSavedKeyHint] = useState<string | null>(null);
  const [hasApiKey, setHasApiKey] = useState(false);
  const [keySaving, setKeySaving] = useState(false);
  const [keyClearing, setKeyClearing] = useState(false);
  const [keySaved, setKeySaved] = useState(false);
  const [keyTesting, setKeyTesting] = useState(false);
  const [keyTestResult, setKeyTestResult] = useState<{ success: boolean; source: string; models?: string[]; error?: string } | null>(null);

  useEffect(() => {
    setMounted(true);
    // Fetch existing key hint
    fetch("/api/preferences")
      .then((r) => r.json())
      .then((data) => {
        setHasApiKey(data.hasApiKey ?? false);
        setSavedKeyHint(data.apiKeyHint ?? null);
      })
      .catch(() => {});
  }, []);

  async function handleSaveKey() {
    if (!apiKeyInput.trim() || keySaving) return;
    setKeySaving(true);
    try {
      await fetch("/api/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ openaiApiKey: apiKeyInput.trim() }),
      });
      setHasApiKey(true);
      setSavedKeyHint(`${apiKeyInput.slice(0, 7)}...${apiKeyInput.slice(-4)}`);
      setApiKeyInput("");
      setKeySaved(true);
      setTimeout(() => setKeySaved(false), 2500);
    } finally {
      setKeySaving(false);
    }
  }

  async function handleTestKey() {
    if (keyTesting) return;
    setKeyTesting(true);
    setKeyTestResult(null);
    try {
      const res = await fetch("/api/ai/test-key");
      const data = await res.json();
      setKeyTestResult(data);
    } catch {
      setKeyTestResult({ success: false, source: "unknown", error: "Network error" });
    } finally {
      setKeyTesting(false);
    }
  }

  async function handleClearKey() {
    if (keyClearing) return;
    setKeyClearing(true);
    try {
      await fetch("/api/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ openaiApiKey: null }),
      });
      setHasApiKey(false);
      setSavedKeyHint(null);
      setApiKeyInput("");
    } finally {
      setKeyClearing(false);
    }
  }

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

          {/* AI API Key Section */}
          <div className="space-y-3">
            <h3 className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest font-heading">AI API Key</h3>
            <div className="space-y-3 p-3.5 border border-border/45 rounded-lg bg-background">
              <div className="flex items-start gap-2.5">
                <div className="size-8 rounded bg-[#8b5cf6]/10 flex items-center justify-center shrink-0 mt-0.5">
                  <RiKeyLine className="size-4 text-[#8b5cf6]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-foreground">OpenAI API Key</p>
                  <p className="text-[10px] text-muted-foreground leading-relaxed mt-0.5">
                    Paste your own key to use your OpenAI quota. Leave empty to use the shared key.
                  </p>
                </div>
              </div>

              {/* Current saved key */}
              {hasApiKey && savedKeyHint && (
                <div className="flex items-center justify-between px-3 py-2 bg-secondary/40 border border-border/30 rounded-md">
                  <div className="flex items-center gap-2">
                    <span className="size-1.5 rounded-full bg-emerald-500 shrink-0" />
                    <span className="text-[10px] font-mono text-muted-foreground">{savedKeyHint}</span>
                    <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded-full">Active</span>
                  </div>
                  <button
                    onClick={handleClearKey}
                    disabled={keyClearing}
                    className="flex items-center gap-1 text-[9px] font-semibold text-muted-foreground/50 hover:text-rose-500 transition-colors cursor-pointer disabled:opacity-40"
                  >
                    {keyClearing ? <RiLoaderLine className="size-3 animate-spin" /> : <RiDeleteBinLine className="size-3" />}
                    Remove
                  </button>
                </div>
              )}

              {/* Input row */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type={showKey ? "text" : "password"}
                    value={apiKeyInput}
                    onChange={(e) => setApiKeyInput(e.target.value)}
                    placeholder={hasApiKey ? "Paste new key to replace…" : "sk-..."}
                    onKeyDown={(e) => e.key === "Enter" && handleSaveKey()}
                    className="w-full h-8 pl-3 pr-8 text-[11px] font-mono text-foreground bg-secondary/30 border border-border/40 rounded-md outline-none focus:border-[#8b5cf6]/50 focus:ring-1 focus:ring-[#8b5cf6]/20 placeholder:text-muted-foreground/40 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey((v) => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-muted-foreground transition-colors cursor-pointer"
                  >
                    {showKey ? <RiEyeOffLine className="size-3.5" /> : <RiEyeLine className="size-3.5" />}
                  </button>
                </div>
                <button
                  onClick={handleSaveKey}
                  disabled={!apiKeyInput.trim() || keySaving}
                  className="flex items-center gap-1.5 px-3 h-8 text-[10px] font-bold uppercase tracking-wider rounded-md bg-[#8b5cf6] text-white hover:bg-[#7c3aed] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer shrink-0"
                >
                  {keySaving ? (
                    <RiLoaderLine className="size-3 animate-spin" />
                  ) : keySaved ? (
                    <RiCheckLine className="size-3" />
                  ) : null}
                  {keySaving ? "Saving…" : keySaved ? "Saved!" : "Save"}
                </button>
              </div>

              {/* Test Connection */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={handleTestKey}
                  disabled={keyTesting}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-md text-muted-foreground hover:text-foreground bg-secondary/40 hover:bg-secondary/80 border border-border/30 transition-all disabled:opacity-50 cursor-pointer disabled:cursor-default"
                >
                  {keyTesting ? <RiLoaderLine className="size-3 animate-spin" /> : <RiKeyLine className="size-3" />}
                  {keyTesting ? "Testing…" : "Test Connection"}
                </button>
                {keyTestResult && (
                  <span className={`text-[10px] font-semibold ${keyTestResult.success ? "text-emerald-500" : "text-rose-500"}`}>
                    {keyTestResult.success
                      ? `✓ Working (${keyTestResult.source})`
                      : `✗ ${keyTestResult.error ?? "Failed"} (${keyTestResult.source})`}
                  </span>
                )}
              </div>

              {/* Show available models on success */}
              {keyTestResult?.success && keyTestResult.models && keyTestResult.models.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {keyTestResult.models.map((m) => (
                    <span key={m} className="text-[9px] font-mono text-muted-foreground bg-secondary/50 border border-border/30 rounded px-1.5 py-0.5">{m}</span>
                  ))}
                </div>
              )}
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

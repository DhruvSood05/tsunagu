"use client";

import { useState } from "react";
import { useTheme } from "@/lib/theme/ThemeProvider";
import { authClient } from "@/lib/auth-client";
import Sidebar from "@/components/layout/Sidebar";
import TopNav from "@/components/layout/TopNav";
import SettingsOverlay from "@/components/layout/SettingsOverlay";
import DemoBanner from "@/app/demo/DemoBanner";
import DemoSignInModal from "@/app/demo/DemoSignInModal";
import { useDemoContext } from "@/lib/demo/DemoContext";
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
  RiRobot2Line,
  RiLogoutBoxLine,
  RiCheckLine,
  RiDeleteBinLine,
  RiFlashlightLine,
  RiKeyboardLine,
  RiBrainLine,
  RiSparklingLine,
} from "@remixicon/react";

/* ── Shared sub-components (identical to real settings) ── */

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10.5px] font-bold text-muted-foreground/40 uppercase tracking-[0.14em] mb-2.5 px-0.5">
      {children}
    </p>
  );
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-card border border-border rounded-2xl overflow-hidden shadow-[0_1px_4px_rgba(0,0,0,0.06)] dark:shadow-[0_1px_8px_rgba(0,0,0,0.25)] ${className}`}>
      {children}
    </div>
  );
}

function Row({ children, last = false }: { children: React.ReactNode; last?: boolean }) {
  return (
    <div className={`px-5 py-4 flex items-center justify-between gap-4 ${last ? "" : "border-b border-border/40"}`}>
      {children}
    </div>
  );
}

function ConnectedBadge({ connected }: { connected: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-[10.5px] font-bold px-2.5 py-1 rounded-full leading-none tracking-wide ${
      connected
        ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/25"
        : "bg-secondary text-muted-foreground/60 border border-border/50"
    }`}>
      <span className={`size-1.5 rounded-full ${connected ? "bg-emerald-500" : "bg-muted-foreground/30"}`} />
      {connected ? "Connected" : "Not connected"}
    </span>
  );
}

function GhostButton({
  children,
  onClick,
  disabled,
  className = "",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`group inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[12px] font-semibold text-foreground bg-secondary/60 border border-border/60 hover:bg-secondary hover:border-border active:scale-[0.97] transition-all duration-150 disabled:opacity-40 disabled:pointer-events-none cursor-pointer shrink-0 ${className}`}
    >
      {children}
    </button>
  );
}

function PrimaryButton({
  children,
  onClick,
  className = "",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`group inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-[12px] font-semibold bg-primary text-primary-foreground hover:bg-primary/88 active:scale-[0.97] shadow-sm shadow-primary/20 transition-all duration-150 cursor-pointer shrink-0 ${className}`}
    >
      {children}
    </button>
  );
}

function DangerButton({
  children,
  onClick,
  className = "",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`group inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-[12px] font-semibold text-rose-500 dark:text-rose-400 border border-rose-500/20 dark:border-rose-500/25 hover:bg-rose-500/8 dark:hover:bg-rose-500/10 active:scale-[0.97] transition-all duration-150 cursor-pointer shrink-0 ${className}`}
    >
      {children}
    </button>
  );
}

/* ────────────────────────────────────────────────────────── */

export default function DemoSettingsContent() {
  const ctx = useDemoContext();
  const { theme, setTheme } = useTheme();
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showMemory, setShowMemory] = useState(false);

  const user = ctx.user;
  const initials = user.name
    ? user.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
    : "AC";

  const signIn = () => authClient.signIn.social({ provider: "google", callbackURL: "/dashboard" });

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      <DemoBanner />

      <div className="flex flex-1 overflow-hidden min-h-0">
        <Sidebar
          user={user}
          gmailConnected={true}
          calendarConnected={true}
          basePath="/demo"
        />

        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          <TopNav
            user={user}
            gmailConnected={true}
            onOpenPalette={() => ctx.setShowSignInModal(true)}
          />

          <div className="flex-1 overflow-y-auto bg-background dark:bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(231,111,81,0.04),transparent)]">
            <div className="max-w-[680px] mx-auto px-6 py-10 space-y-8">

              {/* Page header */}
              <div className="pb-2">
                <h1 className="text-[24px] font-bold text-foreground tracking-tight leading-tight">Settings</h1>
                <p className="text-[13px] text-muted-foreground mt-1.5">Manage your account, appearance, and integrations.</p>
              </div>

              {/* ── Account ──────────────────────────────── */}
              <section className="space-y-2.5">
                <SectionLabel>Account</SectionLabel>
                <Card>
                  <div className="px-5 py-5 flex items-center gap-4">
                    <div className="relative shrink-0">
                      <div className="size-[52px] rounded-full bg-gradient-to-br from-primary/25 to-primary/10 border border-primary/20 flex items-center justify-center shadow-md">
                        <span className="text-[16px] font-bold text-primary">{initials}</span>
                      </div>
                      <span className="absolute bottom-0.5 right-0.5 size-3 rounded-full bg-emerald-500 border-[2px] border-card shadow-sm" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[14.5px] font-semibold text-foreground leading-tight truncate">{user.name}</p>
                      <p className="text-[12px] text-muted-foreground truncate mt-0.5">{user.email}</p>
                      <span className="inline-flex items-center gap-1.5 mt-2 text-[10px] font-bold px-2.5 py-1 rounded-full bg-secondary text-muted-foreground border border-border/50 uppercase tracking-wider">
                        Demo Account
                      </span>
                    </div>
                  </div>
                </Card>
              </section>

              {/* ── Appearance ───────────────────────────── */}
              <section className="space-y-2.5">
                <SectionLabel>Appearance</SectionLabel>
                <Card>
                  <div className="px-5 py-5 space-y-4">
                    <div>
                      <p className="text-[13.5px] font-semibold text-foreground">Theme</p>
                      <p className="text-[12px] text-muted-foreground mt-0.5">Choose how Tsunagu appears on your device.</p>
                    </div>
                    <div className="grid grid-cols-3 gap-2.5">
                      {([
                        { key: "light",  label: "Light",  icon: RiSunLine,      preview: "bg-[#f8f9fc] border-[#e2e7f0]" },
                        { key: "dark",   label: "Dark",   icon: RiMoonLine,     preview: "bg-[#0c0c10] border-[rgba(255,255,255,0.07)]" },
                        { key: "system", label: "System", icon: RiComputerLine, preview: "bg-gradient-to-br from-[#f8f9fc] to-[#0c0c10] border-border/50" },
                      ] as const).map(({ key, label, icon: Icon, preview }) => {
                        const active = theme === key;
                        return (
                          <button
                            key={key}
                            onClick={() => setTheme(key)}
                            className={`relative flex flex-col gap-3 p-3.5 rounded-xl border text-left transition-all duration-200 cursor-pointer focus:outline-none active:scale-[0.97] ${
                              active
                                ? "border-primary/40 bg-primary/5 dark:bg-primary/8 shadow-[0_0_0_1px_rgba(231,111,81,0.2),0_2px_8px_rgba(231,111,81,0.08)]"
                                : "border-border/50 bg-secondary/20 hover:bg-secondary/50 hover:border-border/80"
                            }`}
                          >
                            <div className={`h-7 w-full rounded-lg border ${preview}`} />
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Icon className={`size-3.5 transition-colors ${active ? "text-primary" : "text-muted-foreground"}`} />
                                <span className={`text-[11.5px] font-semibold transition-colors ${active ? "text-primary" : "text-muted-foreground"}`}>{label}</span>
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
                  </div>
                </Card>
              </section>

              {/* ── AI Assistant ─────────────────────────── */}
              <section className="space-y-2.5">
                <SectionLabel>AI Assistant</SectionLabel>
                <Card>
                  <div className="px-5 py-5 space-y-4">
                    <div className="flex items-start gap-3.5">
                      <div className="size-10 rounded-xl bg-secondary border border-border/60 flex items-center justify-center shrink-0">
                        <RiRobot2Line className="size-5 text-muted-foreground/40" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-[13.5px] font-semibold text-foreground">Tsunagu AI</p>
                          <span className="shrink-0 text-[10.5px] font-bold px-2.5 py-1 rounded-full border leading-none bg-secondary text-muted-foreground/60 border-border/50 uppercase tracking-wide">
                            Demo Mode
                          </span>
                        </div>
                        <p className="text-[12px] text-muted-foreground mt-0.5 leading-relaxed">
                          AI features are disabled in the demo. Sign in with your Google account to unlock AI drafts, smart scheduling, and semantic search.
                        </p>
                        <PrimaryButton onClick={signIn} className="mt-3">
                          <RiSparklingLine className="size-3.5" />
                          Sign in to unlock AI
                        </PrimaryButton>
                      </div>
                    </div>
                  </div>
                </Card>
              </section>

              {/* ── AI Memory ────────────────────────────── */}
              <section className="space-y-2.5">
                <SectionLabel>AI Memory</SectionLabel>
                <Card>
                  <div className="px-5 py-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      <div className="size-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                        <RiBrainLine className="size-4.5 text-primary" />
                      </div>
                      <div>
                        <p className="text-[13.5px] font-semibold text-foreground">Long-term Memory</p>
                        <p className="text-[12px] text-muted-foreground mt-0.5">AI remembers context from past conversations</p>
                      </div>
                    </div>
                    <GhostButton onClick={() => setShowMemory(true)}>
                      <RiBrainLine className="size-3.5" />
                      View Memory
                    </GhostButton>
                  </div>
                </Card>
              </section>

              {/* ── Integrations ─────────────────────────── */}
              <section className="space-y-2.5">
                <SectionLabel>Integrations</SectionLabel>
                <div className="grid grid-cols-2 gap-3">
                  <Card>
                    <div className="px-4 pt-4 pb-4 space-y-3.5 flex flex-col h-full">
                      <div className="flex items-start gap-3">
                        <div className="size-9 rounded-xl bg-gradient-to-br from-[#ea4335]/15 to-[#ea4335]/5 border border-[#ea4335]/15 dark:border-[#ea4335]/10 flex items-center justify-center shrink-0">
                          <RiGoogleFill className="size-4 text-[#ea4335]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-semibold text-foreground leading-tight">Gmail</p>
                          <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">Read, send &amp; manage emails</p>
                        </div>
                      </div>
                      <ConnectedBadge connected={true} />
                      <DangerButton onClick={signIn} className="mt-auto w-full">
                        Sign in to manage
                      </DangerButton>
                    </div>
                  </Card>

                  <Card>
                    <div className="px-4 pt-4 pb-4 space-y-3.5 flex flex-col h-full">
                      <div className="flex items-start gap-3">
                        <div className="size-9 rounded-xl bg-gradient-to-br from-[#4285f4]/15 to-[#4285f4]/5 border border-[#4285f4]/15 dark:border-[#4285f4]/10 flex items-center justify-center shrink-0">
                          <RiCalendarLine className="size-4 text-[#4285f4]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-semibold text-foreground leading-tight">Calendar</p>
                          <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">Sync events &amp; schedule</p>
                        </div>
                      </div>
                      <ConnectedBadge connected={true} />
                      <DangerButton onClick={signIn} className="mt-auto w-full">
                        Sign in to manage
                      </DangerButton>
                    </div>
                  </Card>
                </div>
              </section>

              {/* ── Keyboard Shortcuts ───────────────────── */}
              <section className="space-y-2.5">
                <SectionLabel>Keyboard Shortcuts</SectionLabel>
                <Card>
                  <div className="px-5 py-4 flex items-center justify-between gap-4">
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
                      <GhostButton onClick={() => setShowShortcuts(true)}>
                        <RiKeyboardLine className="size-3.5" />
                        View Shortcuts
                      </GhostButton>
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
                              label: "Email",
                              shortcuts: [
                                { keys: ["J"], desc: "Next email" },
                                { keys: ["K"], desc: "Previous email" },
                                { keys: ["E"], desc: "Archive selected email" },
                                { keys: ["R"], desc: "Reply to email" },
                                { keys: ["C"], desc: "Compose new message" },
                                { keys: ["Esc"], desc: "Close email / deselect" },
                              ],
                            },
                            {
                              label: "General",
                              shortcuts: [
                                { keys: ["?"], desc: "Show keyboard shortcuts" },
                                { keys: ["Ctrl", "K"], desc: "Open command palette" },
                              ],
                            },
                          ] as const).map((group) => (
                            <div key={group.label} className="space-y-2">
                              <p className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest">{group.label}</p>
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

              {/* ── Platform ─────────────────────────────── */}
              <section className="space-y-2.5">
                <SectionLabel>Platform</SectionLabel>
                <Card>
                  <Row last>
                    <div className="flex items-center gap-3.5">
                      <div className="size-10 rounded-xl bg-secondary border border-border/60 flex items-center justify-center shrink-0">
                        <RiFlashlightLine className="size-4.5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-[13.5px] font-semibold text-foreground">Walkthrough Tour</p>
                        <p className="text-[12px] text-muted-foreground mt-0.5">Available after signing in to your account</p>
                      </div>
                    </div>
                    <GhostButton onClick={signIn}>
                      Sign in to enable
                    </GhostButton>
                  </Row>
                </Card>
              </section>

              {/* ── Session ──────────────────────────────── */}
              <section className="space-y-2.5">
                <SectionLabel>Session</SectionLabel>
                <Card>
                  <Row last>
                    <div className="flex items-center gap-3.5">
                      <div className="size-10 rounded-xl bg-rose-500/8 dark:bg-rose-500/6 border border-rose-500/15 flex items-center justify-center shrink-0">
                        <RiLogoutBoxLine className="size-4.5 text-rose-500/70 dark:text-rose-400/70" />
                      </div>
                      <div>
                        <p className="text-[13.5px] font-semibold text-foreground">Sign in to Tsunagu</p>
                        <p className="text-[12px] text-muted-foreground mt-0.5">Connect Gmail and Calendar to get started</p>
                      </div>
                    </div>
                    <PrimaryButton onClick={signIn}>
                      Sign in with Google
                    </PrimaryButton>
                  </Row>
                </Card>
              </section>

              {/* ── Danger Zone ──────────────────────────── */}
              <section className="space-y-2.5">
                <SectionLabel>Danger Zone</SectionLabel>
                <Card>
                  <Row last>
                    <div className="flex items-center gap-3.5">
                      <div className="size-10 rounded-xl bg-rose-500/8 dark:bg-rose-500/6 border border-rose-500/15 flex items-center justify-center shrink-0">
                        <RiDeleteBinLine className="size-4.5 text-rose-500/70 dark:text-rose-400/70" />
                      </div>
                      <div>
                        <p className="text-[13.5px] font-semibold text-foreground">Delete account</p>
                        <p className="text-[12px] text-muted-foreground mt-0.5">Sign in to manage your account data</p>
                      </div>
                    </div>
                    <DangerButton onClick={signIn}>
                      <RiDeleteBinLine className="size-3.5" />
                      Sign in to delete
                    </DangerButton>
                  </Row>
                </Card>
              </section>

              <div className="h-8" />
            </div>
          </div>
        </div>
      </div>

      {/* Memory dialog — shows "not available in demo" */}
      <Dialog open={showMemory} onOpenChange={setShowMemory}>
        <DialogContent className="max-w-lg" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RiBrainLine className="size-4 text-primary" />
              AI Memory
            </DialogTitle>
          </DialogHeader>
          <div className="py-8 text-center space-y-3">
            <RiBrainLine className="size-8 text-muted-foreground/30 mx-auto" />
            <p className="text-[13px] font-medium text-muted-foreground">Memory is not available in demo mode</p>
            <p className="text-[12px] text-muted-foreground/60 leading-relaxed">
              Sign in with your Google account to enable long-term AI memory across conversations.
            </p>
            <PrimaryButton onClick={() => { setShowMemory(false); signIn(); }} className="mx-auto mt-2">
              <RiBrainLine className="size-3.5" />
              Sign in to enable
            </PrimaryButton>
          </div>
        </DialogContent>
      </Dialog>

      <SettingsOverlay user={user} gmailConnected={false} calendarConnected={false} />
      <DemoSignInModal />
    </div>
  );
}

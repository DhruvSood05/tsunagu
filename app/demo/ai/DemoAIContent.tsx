"use client";

import { RiLockLine, RiRobot2Line } from "@remixicon/react";
import { Sparkles } from "lucide-react";
import Sidebar from "@/components/layout/Sidebar";
import TopNav from "@/components/layout/TopNav";
import SettingsOverlay from "@/components/layout/SettingsOverlay";
import DemoBanner from "@/app/demo/DemoBanner";
import DemoSignInModal from "@/app/demo/DemoSignInModal";
import { useDemoContext } from "@/lib/demo/DemoContext";
import { authClient } from "@/lib/auth-client";

export default function DemoAIContent() {
  const ctx = useDemoContext();

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      <DemoBanner />

      <div className="flex flex-1 overflow-hidden min-h-0">
        <Sidebar
          user={ctx.user}
          gmailConnected={true}
          calendarConnected={true}
          basePath="/demo"
        />

        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          <TopNav
            user={ctx.user}
            gmailConnected={true}
            onOpenPalette={() => ctx.setShowSignInModal(true)}
          />

          <div className="flex-1 flex items-center justify-center p-8">
            <div className="max-w-sm w-full text-center space-y-6">
              <div className="mx-auto size-20 rounded-3xl bg-secondary border border-border/60 flex items-center justify-center shadow-sm">
                <div className="relative">
                  <RiRobot2Line className="size-9 text-muted-foreground/40" />
                  <div className="absolute -bottom-1 -right-1 size-5 rounded-full bg-background border border-border/60 flex items-center justify-center">
                    <RiLockLine className="size-3 text-muted-foreground/60" />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h2 className="text-xl font-bold text-foreground tracking-tight">AI features require sign-in</h2>
                <p className="text-[13px] text-muted-foreground leading-relaxed">
                  You're exploring Tsunagu in demo mode. Sign in with your Google account to unlock AI-powered email drafting, smart scheduling, and semantic search.
                </p>
              </div>

              <div className="bg-secondary/40 border border-border/50 rounded-2xl p-4 text-left space-y-3">
                <p className="text-[11px] font-bold text-muted-foreground/50 uppercase tracking-widest">What you get with AI</p>
                {[
                  "AI drafts replies in your voice",
                  "Summarise long email threads instantly",
                  "Manage Google Calendar events by chat",
                  "Long-term memory across conversations",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2.5">
                    <div className="size-4 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                      <div className="size-1.5 rounded-full bg-primary" />
                    </div>
                    <span className="text-[12.5px] text-foreground/80">{item}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => authClient.signIn.social({ provider: "google", callbackURL: "/dashboard" })}
                className="w-full flex items-center justify-center gap-2 py-2.5 text-[13px] font-semibold bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shadow-sm shadow-primary/20 transition-all cursor-pointer"
              >
                <Sparkles className="size-4" strokeWidth={1.75} />
                Sign in to unlock AI
              </button>

              <button
                onClick={() => ctx.setShowSignInModal(true)}
                className="w-full py-2 text-[12px] text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                Learn more about Tsunagu AI →
              </button>
            </div>
          </div>
        </div>
      </div>

      <SettingsOverlay user={ctx.user} gmailConnected={false} calendarConnected={false} />
      <DemoSignInModal />
    </div>
  );
}

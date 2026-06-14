"use client";

import { Button } from "@/components/ui/button";
import { RiGoogleFill, RiMailLine, RiShieldCheckLine, RiInboxLine } from "@remixicon/react";

export default function ConnectGmail() {
  return (
    <div className="flex min-h-screen">
      {/* Left panel — branding */}
      <div className="hidden lg:flex w-1/2 bg-primary flex-col justify-between p-12">
        <div className="flex items-center gap-2">
          <RiMailLine className="text-primary-foreground size-5" />
          <span className="text-primary-foreground font-semibold text-sm tracking-wide">
            Tsunagu
          </span>
        </div>

        <div className="space-y-8">
          <div className="space-y-3">
            {[
              { icon: RiInboxLine, text: "Unified inbox with smart category tabs" },
              { icon: RiShieldCheckLine, text: "Your credentials are encrypted and never stored in plain text" },
              { icon: RiMailLine, text: "Reply, compose, and manage drafts in one place" },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-start gap-3">
                <Icon className="size-4 text-primary-foreground/60 mt-0.5 shrink-0" />
                <p className="text-primary-foreground/80 text-sm leading-relaxed">{text}</p>
              </div>
            ))}
          </div>

          <blockquote className="text-primary-foreground/60 text-xs leading-relaxed italic border-l border-primary-foreground/20 pl-4">
            &ldquo;The fastest way to manage your Gmail inbox.&rdquo;
          </blockquote>
        </div>
      </div>

      {/* Right panel — connect */}
      <div className="flex flex-1 flex-col items-center justify-center px-8">
        <div className="w-full max-w-sm space-y-8">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 lg:hidden">
            <RiMailLine className="size-5 text-foreground" />
            <span className="font-semibold text-sm">Tsunagu</span>
          </div>

          {/* Step indicator */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <span className="size-5 rounded-full bg-primary flex items-center justify-center">
                <svg className="size-3 text-primary-foreground" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <span className="text-xs text-muted-foreground">Signed in</span>
            </div>
            <div className="h-px w-6 bg-border" />
            <div className="flex items-center gap-1.5">
              <span className="size-5 rounded-full bg-primary flex items-center justify-center">
                <span className="text-[10px] font-semibold text-primary-foreground">2</span>
              </span>
              <span className="text-xs font-medium text-foreground">Connect Gmail</span>
            </div>
            <div className="h-px w-6 bg-border" />
            <div className="flex items-center gap-1.5">
              <span className="size-5 rounded-full bg-muted border-2 border-border flex items-center justify-center">
                <span className="text-[10px] font-semibold text-muted-foreground">3</span>
              </span>
              <span className="text-xs text-muted-foreground">Calendar</span>
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight">Connect your Gmail</h1>
            <p className="text-sm text-muted-foreground">
              Grant read and send access so Tsunagu can manage your inbox.
            </p>
          </div>

          <Button
            size="lg"
            className="w-full gap-2"
            onClick={() => { window.location.href = "/api/connect?plugin=gmail"; }}
          >
            <RiGoogleFill className="size-4" />
            Connect Gmail with Google
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            Your tokens are encrypted at rest. Tsunagu never reads your email on behalf of anyone but you.
          </p>
        </div>
      </div>
    </div>
  );
}

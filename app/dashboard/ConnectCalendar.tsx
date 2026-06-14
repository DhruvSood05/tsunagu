"use client";

import { Button } from "@/components/ui/button";
import {
  RiCalendarLine,
  RiGoogleFill,
  RiMailLine,
  RiRobot2Line,
  RiShieldCheckLine,
  RiTimeLine,
} from "@remixicon/react";

export default function ConnectCalendar() {
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
              { icon: RiTimeLine, text: "See upcoming meetings right inside your inbox" },
              { icon: RiMailLine, text: "Turn emails into calendar events with one click" },
              { icon: RiRobot2Line, text: "Let the AI agent schedule meetings and send invites on your behalf" },
              { icon: RiShieldCheckLine, text: "Calendar access is encrypted and scoped to your account only" },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-start gap-3">
                <Icon className="size-4 text-primary-foreground/60 mt-0.5 shrink-0" />
                <p className="text-primary-foreground/80 text-sm leading-relaxed">{text}</p>
              </div>
            ))}
          </div>

          <blockquote className="text-primary-foreground/60 text-xs leading-relaxed italic border-l border-primary-foreground/20 pl-4">
            &ldquo;Schedule, send, and manage — all from one place.&rdquo;
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
                <svg className="size-3 text-primary-foreground" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <span className="text-xs text-muted-foreground">Gmail</span>
            </div>
            <div className="h-px w-6 bg-border" />
            <div className="flex items-center gap-1.5">
              <span className="size-5 rounded-full bg-primary flex items-center justify-center">
                <span className="text-[10px] font-semibold text-primary-foreground">3</span>
              </span>
              <span className="text-xs font-medium text-foreground">Connect Calendar</span>
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight">Connect Google Calendar</h1>
            <p className="text-sm text-muted-foreground">
              Grant calendar access so Tsunagu can show your schedule and create events from emails.
            </p>
          </div>

          <div className="space-y-3">
            <Button
              size="lg"
              className="w-full gap-2"
              onClick={() => { window.location.href = "/api/connect?plugin=googlecalendar"; }}
            >
              <RiGoogleFill className="size-4" />
              Connect Google Calendar
            </Button>

            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border">
              <RiCalendarLine className="size-4 text-primary shrink-0" />
              <p className="text-xs text-muted-foreground">
                This connects the same Google account you used for Gmail — no additional sign-in needed.
              </p>
            </div>
          </div>

          <p className="text-center text-xs text-muted-foreground">
            Your calendar data stays private. Tsunagu only reads events to display them and creates events you explicitly approve.
          </p>
        </div>
      </div>
    </div>
  );
}

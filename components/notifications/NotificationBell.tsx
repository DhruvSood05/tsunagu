"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { RiNotification3Line, RiRefreshLine, RiInboxLine } from "@remixicon/react";
import { PRIORITY_STORAGE_KEY } from "@/constants/calendar";
import {
  PRIORITY_RANK,
  type NotificationEmail,
  type NotificationEvent,
  type Priority,
} from "./notification-utils";
import NotificationEmailItem from "./NotificationEmailItem";
import NotificationEventItem from "./NotificationEventItem";

export default function NotificationBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [emails, setEmails] = useState<NotificationEmail[]>([]);
  const [events, setEvents] = useState<NotificationEvent[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/notifications/today");
      if (!res.ok) return;
      const data = await res.json();

      // Overlay user-set calendar priorities (stored client-side) onto events.
      let eventPriorities: Record<string, Priority> = {};
      try {
        eventPriorities = JSON.parse(localStorage.getItem(PRIORITY_STORAGE_KEY) ?? "{}");
      } catch {}

      const sortedEmails: NotificationEmail[] = [...((data.emails ?? []) as NotificationEmail[])].sort(
        (a, b) =>
          PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] ||
          new Date(b.date).getTime() - new Date(a.date).getTime(),
      );

      const sortedEvents: NotificationEvent[] = [...(data.events ?? [])]
        .map((e: NotificationEvent) => ({ ...e, priority: eventPriorities[e.id] ?? "medium" }))
        .sort(
          (a, b) =>
            PRIORITY_RANK[a.priority!] - PRIORITY_RANK[b.priority!] ||
            new Date(a.start?.dateTime ?? a.start?.date ?? 0).getTime() -
              new Date(b.start?.dateTime ?? b.start?.date ?? 0).getTime(),
        );

      setEmails(sortedEmails);
      setEvents(sortedEvents);
      setLoaded(true);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load the first time the panel is opened.
  useEffect(() => {
    if (open && !loaded) load();
  }, [open, loaded, load]);

  const totalCount = emails.length + events.length;
  const hasItems = !loaded || totalCount > 0;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Notifications"
        className="relative size-8 flex items-center justify-center rounded-md hover:bg-secondary/80 text-muted-foreground hover:text-foreground transition-all duration-150 active:scale-95 cursor-pointer"
      >
        <RiNotification3Line className="size-4.5" />
        {hasItems && (
          <span className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-emerald-500 ring-2 ring-background animate-pulse" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 rounded-xl border border-border bg-card shadow-xl animate-in fade-in-50 slide-in-from-top-2 duration-150 z-50 overflow-hidden font-sans">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/40 bg-card/60">
            <div>
              <p className="text-xs font-bold text-foreground tracking-tight">Today</p>
              <p className="text-[10px] text-muted-foreground/70 mt-0.5">
                {new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
              </p>
            </div>
            <button
              onClick={load}
              disabled={loading}
              className="size-6 flex items-center justify-center rounded-md text-muted-foreground/60 hover:text-foreground hover:bg-secondary/60 transition-all cursor-pointer disabled:opacity-40"
              title="Refresh"
            >
              <RiRefreshLine className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>

          {/* Body */}
          <div className="max-h-104 overflow-y-auto p-2">
            {loading && !loaded ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2 text-muted-foreground/40">
                <RiRefreshLine className="size-5 animate-spin" />
                <p className="text-[11px]">Loading…</p>
              </div>
            ) : totalCount === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2 text-muted-foreground/40">
                <RiInboxLine className="size-6" />
                <p className="text-[11px]">You're all caught up</p>
              </div>
            ) : (
              <div className="space-y-3">
                {events.length > 0 && (
                  <section>
                    <p className="px-2.5 pb-1 text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground/50">
                      Events · {events.length}
                    </p>
                    <div className="space-y-0.5">
                      {events.map((ev) => (
                        <NotificationEventItem
                          key={ev.id}
                          event={ev}
                          onClick={() => {
                            setOpen(false);
                            router.push("/dashboard/calendar");
                          }}
                        />
                      ))}
                    </div>
                  </section>
                )}

                {emails.length > 0 && (
                  <section>
                    <p className="px-2.5 pb-1 text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground/50">
                      Important Emails · {emails.length}
                    </p>
                    <div className="space-y-0.5">
                      {emails.map((email) => (
                        <NotificationEmailItem
                          key={email.id}
                          email={email}
                          onClick={() => {
                            setOpen(false);
                            router.push("/dashboard");
                          }}
                        />
                      ))}
                    </div>
                  </section>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

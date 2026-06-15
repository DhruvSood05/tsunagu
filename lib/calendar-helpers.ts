import React from "react";
import type { CalendarEvent } from "@/types/calendar";
import { GCAL_COLORS, GCAL_DEFAULT } from "@/constants/calendar";

// ── Date/time formatting ─────────────────────────────────────────────────────

function pad(n: number) { return String(n).padStart(2, "0"); }

export function localDateStr(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function localTimeStr(d: Date) {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function formatTime(dt?: string) {
  if (!dt) return "";
  return new Date(dt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export function formatDateMed(dt?: string, date?: string) {
  const src = dt ?? (date ? date + "T00:00:00" : undefined);
  if (!src) return "";
  return new Date(src).toLocaleDateString([], {
    weekday: "short", month: "short", day: "numeric", year: "numeric",
  });
}

export function todayDateStr() {
  return new Date().toISOString().split("T")[0];
}

// ── Description handling ─────────────────────────────────────────────────────

export function parseDescription(raw?: string): string {
  if (!raw) return "";
  return raw
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p\s*>/gi, "\n")
    .replace(/<\/div\s*>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, " ")
    .replace(/\n{3,}/g, "\n\n").trim();
}

// ── URL rendering ────────────────────────────────────────────────────────────

export function renderWithLinks(text: string): (string | React.JSX.Element)[] {
  const urlRegex = /https?:\/\/[^\s\n]+/g;
  const nodes: (string | React.JSX.Element)[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = urlRegex.exec(text)) !== null) {
    if (m.index > last) nodes.push(text.slice(last, m.index));
    const url = m[0];
    const display = url.replace(/^https?:\/\//, "");
    nodes.push(
      React.createElement("a", {
        key: m.index,
        href: url,
        target: "_blank",
        rel: "noreferrer",
        className: "text-primary underline underline-offset-2 break-all hover:opacity-75",
        onClick: (e: React.MouseEvent) => e.stopPropagation(),
      }, display.length > 48 ? display.slice(0, 48) + "…" : display),
    );
    last = m.index + url.length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

// ── Event color ──────────────────────────────────────────────────────────────

export function getEventColor(e: CalendarEvent, calendarColor?: string): string {
  return e.colorId
    ? (GCAL_COLORS[e.colorId]?.hex ?? GCAL_DEFAULT)
    : (calendarColor ?? GCAL_DEFAULT);
}

// ── Event body sanitizer ─────────────────────────────────────────────────────
// Strips read-only Google Calendar API fields that cause events.update to fail.
// These fields appear on raw API responses but are rejected on write.

export function buildEventBody(
  e: CalendarEvent,
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  const cleanDt = (dt: CalendarEvent["start"]) => {
    if (!dt) return undefined;
    if (dt.date) return { date: dt.date };
    return { dateTime: dt.dateTime, ...(dt.timeZone ? { timeZone: dt.timeZone } : {}) };
  };

  const cleanAttendees = (e.attendees as any[])
    ?.map((a) => ({
      email: a.email,
      ...(a.displayName ? { displayName: a.displayName } : {}),
      ...(a.responseStatus ? { responseStatus: a.responseStatus } : {}),
    }))
    .filter((a) => a.email);

  const body: Record<string, unknown> = {
    summary: e.summary,
    start: cleanDt(e.start),
    end: cleanDt(e.end),
  };
  if (e.description) body.description = e.description;
  if (e.location) body.location = e.location;
  if (cleanAttendees?.length) body.attendees = cleanAttendees;
  if (e.colorId) body.colorId = e.colorId;
  return { ...body, ...overrides };
}

export type Priority = "high" | "medium" | "low";

export const PRIORITY_RANK: Record<Priority, number> = { high: 0, medium: 1, low: 2 };

export const PRIORITY_BADGE: Record<Priority, string> = {
  high: "text-rose-500 bg-rose-500/10 border-rose-500/20",
  medium: "text-amber-500 bg-amber-500/10 border-amber-500/20",
  low: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
};

export interface NotificationEmail {
  id: string;
  from: string;
  subject: string;
  snippet: string;
  date: string;
  unread: boolean;
  priority: Priority;
}

export interface NotificationEvent {
  id: string;
  summary: string;
  location: string | null;
  start: { dateTime?: string; date?: string } | null;
  end: { dateTime?: string; date?: string } | null;
  allDay: boolean;
  attendeesCount: number;
  htmlLink: string | null;
  priority?: Priority;
}

// "Jane Doe <jane@x.com>" → "Jane Doe"; bare address → the address.
export function parseSenderName(from: string): string {
  if (!from) return "Unknown";
  const match = from.match(/^\s*"?([^"<]*?)"?\s*<.+>\s*$/);
  const name = match?.[1]?.trim();
  if (name) return name;
  return from.replace(/[<>]/g, "").trim() || "Unknown";
}

export function eventTimeLabel(ev: NotificationEvent): string {
  if (ev.allDay) return "All day";
  const dt = ev.start?.dateTime;
  if (!dt) return "";
  return new Date(dt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

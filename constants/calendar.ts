import type { CalendarView, Priority } from "@/types/calendar";

export const CALENDAR_PALETTE = [
  "#4285F4", "#0B8043", "#D50000", "#F6BF26", "#8E24AA",
  "#E67C73", "#F4511E", "#039BE5", "#33B679", "#7986CB", "#616161",
];

export const COLOR_SWATCHES = [
  "#4285F4", "#7986CB", "#33B679", "#8E24AA", "#E67C73",
  "#F6BF26", "#F4511E", "#039BE5", "#3F51B5", "#0B8043", "#D50000", "#616161",
];

export const GCAL_COLORS: Record<string, { hex: string; name: string }> = {
  "1":  { hex: "#7986CB", name: "Lavender" },
  "2":  { hex: "#33B679", name: "Sage" },
  "3":  { hex: "#8E24AA", name: "Grape" },
  "4":  { hex: "#E67C73", name: "Flamingo" },
  "5":  { hex: "#F6BF26", name: "Banana" },
  "6":  { hex: "#F4511E", name: "Tangerine" },
  "7":  { hex: "#039BE5", name: "Peacock" },
  "8":  { hex: "#3F51B5", name: "Blueberry" },
  "9":  { hex: "#0B8043", name: "Basil" },
  "10": { hex: "#D50000", name: "Tomato" },
  "11": { hex: "#616161", name: "Graphite" },
};

export const GCAL_DEFAULT = "#4285F4";

export const PRIORITY_CONFIG: Record<Priority, { label: string; color: string; bg: string }> = {
  high:   { label: "High",   color: "#ef4444", bg: "rgba(239,68,68,0.08)" },
  medium: { label: "Medium", color: "#f59e0b", bg: "rgba(245,158,11,0.08)" },
  low:    { label: "Low",    color: "#22c55e", bg: "rgba(34,197,94,0.08)" },
};

export const CALENDAR_VIEWS: { key: CalendarView; label: string }[] = [
  { key: "dayGridMonth", label: "Month" },
  { key: "timeGridWeek", label: "Week" },
  { key: "timeGridDay",  label: "Day" },
  { key: "listWeek",     label: "List" },
];

export const RESPONSE_LABELS: Record<string, string> = {
  accepted:    "Accepted",
  declined:    "Declined",
  tentative:   "Maybe",
  needsAction: "Invited",
};

export const COLORS_STORAGE_KEY = "tsunagu-calendar-colors";
export const PRIORITY_STORAGE_KEY = "tsunagu-event-priorities";
export const DEFAULT_PANEL_WIDTH = 340;

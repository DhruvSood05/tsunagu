import type { CalendarView, Priority } from "@/types/calendar";

// Soft pastel palette — easy on the eyes, pairs with dark event text.
export const CALENDAR_PALETTE = [
  "#A7C7E7", "#A8D5BA", "#F5A9A0", "#FBE7A1", "#D8B4E2",
  "#F6B9B3", "#FBC9A0", "#A8D8EA", "#B5E0C0", "#AEB8E8", "#C9CDD4",
];

export const COLOR_SWATCHES = [
  "#A7C7E7", "#AEB8E8", "#A8D5BA", "#D8B4E2", "#F6B9B3",
  "#FBE7A1", "#FBC9A0", "#A8D8EA", "#C7B8EA", "#B5E0C0", "#F5A9A0", "#C9CDD4",
];

export const GCAL_COLORS: Record<string, { hex: string; name: string }> = {
  "1":  { hex: "#C7B8EA", name: "Lavender" },
  "2":  { hex: "#B5E0C0", name: "Sage" },
  "3":  { hex: "#D8B4E2", name: "Grape" },
  "4":  { hex: "#F6B9B3", name: "Flamingo" },
  "5":  { hex: "#FBE7A1", name: "Banana" },
  "6":  { hex: "#FBC9A0", name: "Tangerine" },
  "7":  { hex: "#A8D8EA", name: "Peacock" },
  "8":  { hex: "#AEB8E8", name: "Blueberry" },
  "9":  { hex: "#A8D5BA", name: "Basil" },
  "10": { hex: "#F5A9A0", name: "Tomato" },
  "11": { hex: "#C9CDD4", name: "Graphite" },
};

export const GCAL_DEFAULT = "#A7C7E7";

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

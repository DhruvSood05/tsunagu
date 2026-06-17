"use client";

import {
  Calendar, X, Trash2, ExternalLink,
  Users, MapPin, Pencil, Clock,
} from "lucide-react";
import type { CalendarEvent, CalendarInfo, EditEventForm, Priority } from "@/types/calendar";
import { GCAL_COLORS, GCAL_DEFAULT, PRIORITY_CONFIG, RESPONSE_LABELS } from "@/constants/calendar";
import { formatTime, formatDateMed, parseDescription } from "@/lib/calendar-helpers";

interface EventDetailPanelProps {
  selected: CalendarEvent;
  editMode: boolean;
  editForm: EditEventForm;
  saving: boolean;
  deleting: boolean;
  panelWidth: number;
  calendars: CalendarInfo[];
  calColorMap: Record<string, string>;
  priorities: Record<string, Priority>;
  notesValue: string;
  notesSaving: boolean;
  onClose: () => void;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSave: () => void;
  onDelete: () => void;
  onEditFormChange: (patch: Partial<EditEventForm>) => void;
  onColorChange: (id: string, colorId: string | null) => void;
  onPriorityChange: (id: string, priority: Priority | null) => void;
  onNotesChange: (value: string) => void;
  onNotesSave: () => void;
  onDividerMouseDown: (e: React.MouseEvent) => void;
}

export default function EventDetailPanel({
  selected,
  editMode,
  editForm,
  saving,
  deleting,
  panelWidth,
  calendars,
  calColorMap,
  priorities,
  notesValue,
  notesSaving,
  onClose,
  onStartEdit,
  onCancelEdit,
  onSave,
  onDelete,
  onEditFormChange,
  onColorChange,
  onPriorityChange,
  onNotesChange,
  onNotesSave,
  onDividerMouseDown,
}: EventDetailPanelProps) {
  const calColor = selected._calendarId
    ? (calColorMap[selected._calendarId] ?? GCAL_DEFAULT)
    : GCAL_DEFAULT;

  return (
    <>
      {/* Drag handle */}
      <div
        className="w-px shrink-0 bg-border/40 hover:bg-foreground/20 cursor-col-resize transition-colors select-none"
        onMouseDown={onDividerMouseDown}
      />

      <div
        className="flex flex-col shrink-0 bg-card overflow-hidden border-l border-border/40 font-sans select-none"
        style={{ width: panelWidth }}
      >
        {/* Calendar color accent bar */}
        <div className="h-[3px] w-full shrink-0 opacity-80" style={{ backgroundColor: calColor }} />

        {/* Header */}
        <div className="flex items-start gap-2.5 px-5 py-4 border-b border-border/40 shrink-0 bg-card/15">
          {editMode ? (
            <input
              autoFocus
              value={editForm.title}
              onChange={(e) => onEditFormChange({ title: e.target.value })}
              placeholder="Event title"
              className="flex-1 min-w-0 text-[15px] font-semibold bg-transparent border-b border-border/60 focus:border-foreground/45 focus:outline-none pb-0.5 transition-colors placeholder:text-muted-foreground/35 font-heading"
            />
          ) : (
            <h2 className="flex-1 min-w-0 text-lg font-semibold leading-snug line-clamp-2 text-foreground tracking-tight">
              {selected.summary ?? "(No title)"}
            </h2>
          )}
          <div className="flex items-center gap-0.5 shrink-0 mt-0.5">
            {!editMode && (
              <button
                onClick={onStartEdit}
                className="size-6 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-all cursor-pointer"
                title="Edit"
              >
                <Pencil className="size-3.5" strokeWidth={1.75} />
              </button>
            )}
            <button
              onClick={onClose}
              className="size-6 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-all cursor-pointer"
            >
              <X className="size-3.5" strokeWidth={1.75} />
            </button>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto">
          {/* Date / time */}
          <div className="px-5 py-3.5 border-b border-border/30 bg-card/5">
            {editMode ? (
              <div className="space-y-2.5">
                <div className="flex items-center gap-3">
                  <Calendar className="size-4 text-muted-foreground/60 shrink-0" strokeWidth={1.75} />
                  <input
                    type="date"
                    value={editForm.date}
                    onChange={(e) => onEditFormChange({ date: e.target.value })}
                    className="flex-1 text-[13px] bg-secondary/40 rounded-lg px-2.5 h-9 border border-border/40 focus:border-foreground/30 focus:outline-none transition-colors"
                  />
                </div>
                {selected.start?.dateTime && (
                  <div className="flex items-center gap-3">
                    <Clock className="size-4 text-muted-foreground/60 shrink-0" strokeWidth={1.75} />
                    <div className="flex items-center gap-2 flex-1">
                      <input
                        type="time"
                        value={editForm.startTime}
                        onChange={(e) => onEditFormChange({ startTime: e.target.value })}
                        className="flex-1 text-[13px] bg-secondary/40 rounded-lg px-2.5 h-9 border border-border/40 focus:border-foreground/30 focus:outline-none transition-colors"
                      />
                      <span className="text-[10px] text-muted-foreground/40">–</span>
                      <input
                        type="time"
                        value={editForm.endTime}
                        onChange={(e) => onEditFormChange({ endTime: e.target.value })}
                        className="flex-1 text-[13px] bg-secondary/40 rounded-lg px-2.5 h-9 border border-border/40 focus:border-foreground/30 focus:outline-none transition-colors"
                      />
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <Calendar className="size-4 text-muted-foreground/60 shrink-0" strokeWidth={1.75} />
                  <span className="text-[13px] font-semibold text-foreground">
                    {selected.start?.dateTime
                      ? formatDateMed(selected.start.dateTime)
                      : formatDateMed(undefined, selected.start?.date)}
                  </span>
                </div>
                {selected.start?.dateTime ? (
                  <div className="flex items-center gap-3">
                    <Clock className="size-4 text-muted-foreground/60 shrink-0" strokeWidth={1.75} />
                    <span className="text-[13px] text-muted-foreground/95">
                      {formatTime(selected.start.dateTime)}
                      {selected.end?.dateTime && <> &ndash; {formatTime(selected.end.dateTime)}</>}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <Clock className="size-4 text-muted-foreground/60 shrink-0" strokeWidth={1.75} />
                    <span className="text-[13px] text-muted-foreground/95">All day</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="px-5 py-4 space-y-5">
            {/* Priority */}
            {selected.id && (
              <div className="space-y-2">
                <p className="text-[9.5px] font-bold text-muted-foreground/50 uppercase tracking-[0.13em] font-heading">Priority</p>
                <div className="flex gap-1.5">
                  {(["high", "medium", "low"] as Priority[]).map((p) => {
                    const cfg = PRIORITY_CONFIG[p];
                    const active = priorities[selected.id!] === p;
                    return (
                      <button
                        key={p}
                        onClick={() => onPriorityChange(selected.id!, active ? null : p)}
                        className="flex-1 text-[10px] font-bold py-1.5 rounded-lg border transition-all duration-150 cursor-pointer"
                        style={active
                          ? { backgroundColor: cfg.bg, borderColor: cfg.color + "40", color: cfg.color }
                          : { borderColor: "var(--border)", color: "var(--muted-foreground)", opacity: 0.7 }}
                      >
                        {cfg.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Color */}
            {selected.id && !editMode && (
              <div className="space-y-2">
                <p className="text-[9.5px] font-bold text-muted-foreground/50 uppercase tracking-[0.13em] font-heading">Color</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    title="Calendar default"
                    onClick={() => onColorChange(selected.id!, null)}
                    className="size-5 rounded-full transition-all hover:scale-110 focus:outline-none relative border border-border/20 cursor-pointer"
                    style={{
                      backgroundColor: calColor,
                      boxShadow: !selected.colorId
                        ? `0 0 0 2px var(--background), 0 0 0 3.5px ${calColor}`
                        : undefined,
                    }}
                  >
                    {selected.colorId && (
                      <span className="absolute inset-0 flex items-center justify-center text-white/80 text-[8px] font-bold">↺</span>
                    )}
                  </button>
                  {Object.entries(GCAL_COLORS).map(([id, { hex, name }]) => (
                    <button
                      key={id}
                      title={name}
                      onClick={() => onColorChange(selected.id!, id)}
                      className="size-5 rounded-full transition-all hover:scale-110 focus:outline-none border border-border/20 cursor-pointer"
                      style={{
                        backgroundColor: hex,
                        boxShadow: selected.colorId === id
                          ? `0 0 0 2px var(--background), 0 0 0 3.5px ${hex}`
                          : undefined,
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Calendar selector (edit mode) */}
            {editMode && calendars.length > 1 && (
              <div className="space-y-2">
                <label className="text-[9.5px] font-bold text-muted-foreground/50 uppercase tracking-[0.13em] font-heading">Calendar</label>
                <div className="flex items-center gap-2.5">
                  <span
                    className="size-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: calendars.find((c) => c.id === editForm.calendarId)?.color ?? GCAL_DEFAULT }}
                  />
                  <select
                    value={editForm.calendarId}
                    onChange={(e) => onEditFormChange({ calendarId: e.target.value })}
                    className="flex-1 text-[13px] bg-secondary/40 border border-border/40 rounded-lg px-2.5 h-10 focus:outline-none focus:border-foreground/20 transition-colors cursor-pointer"
                  >
                    {calendars.map((cal) => (
                      <option key={cal.id} value={cal.id} className="bg-card">{cal.summary ?? cal.id}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Calendar label (view mode) */}
            {!editMode && selected._calendarId && calendars.length > 1 && (() => {
              const cal = calendars.find((c) => c.id === selected._calendarId);
              return cal ? (
               <div className="space-y-2">
                <label className="text-[9.5px] font-bold text-muted-foreground/50 uppercase tracking-[0.13em] font-heading">Calendar</label>
                <div className="flex items-center gap-2.5">
                  <span className="size-2 shrink-0 rounded-full border border-border/20" style={{ backgroundColor: cal.color }} />
                  <span className="text-[13px] text-muted-foreground truncate">{cal.summary ?? cal.id}</span>
                </div>
               </div>
              ) : null;
            })()}

            {/* Location */}
            {editMode ? (
              <div className="space-y-2">
                <label className="text-[9.5px] font-bold text-muted-foreground/50 uppercase tracking-[0.13em] font-heading">Location</label>
                <input
                  value={editForm.location}
                  onChange={(e) => onEditFormChange({ location: e.target.value })}
                  placeholder="Add location"
                  className="w-full text-[13px] bg-secondary/40 rounded-lg px-2.5 h-10 border border-border/40 focus:border-foreground/20 focus:outline-none transition-colors placeholder:text-muted-foreground/35"
                />
              </div>
            ) : selected.location ? (
              <div className="space-y-2">
                <label className="text-[9.5px] font-bold text-muted-foreground/50 uppercase tracking-[0.13em] font-heading">Location</label>
              <div className="flex items-start gap-3">
                <MapPin className="size-4 text-muted-foreground/60 mt-0.5 shrink-0" strokeWidth={1.75} />
                <span className="text-[13px] text-foreground leading-relaxed">{selected.location}</span>
              </div>
              </div>
            ) : null}

            {/* Notes */}
            {editMode ? (
              <div className="space-y-2">
                <label className="text-[9.5px] font-bold text-muted-foreground/50 uppercase tracking-[0.13em] font-heading">Notes</label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => onEditFormChange({ description: e.target.value })}
                  placeholder="Add notes"
                  rows={4}
                  className="w-full text-[13px] bg-secondary/40 border border-border/40 rounded-lg px-2.5 py-2 focus:outline-none focus:border-foreground/20 transition-colors placeholder:text-muted-foreground/35 resize-none leading-relaxed"
                />
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-[9.5px] font-bold text-muted-foreground/50 uppercase tracking-[0.13em] flex items-center justify-between font-heading">
                  Notes
                  {notesSaving && <span className="text-[9px] font-normal normal-case text-muted-foreground/50">Saving…</span>}
                </p>
                <textarea
                  value={notesValue}
                  onChange={(e) => onNotesChange(e.target.value)}
                  onBlur={onNotesSave}
                  placeholder="Add notes…"
                  rows={3}
                  className="w-full text-[13px] bg-secondary/40 border border-border/40 rounded-lg px-2.5 py-2 focus:outline-none focus:border-foreground/20 transition-colors placeholder:text-muted-foreground/35 resize-none leading-relaxed"
                />
              </div>
            )}

            {/* Guests */}
            {editMode ? (
              <div className="space-y-2">
                <label className="text-[9.5px] font-bold text-muted-foreground/50 uppercase tracking-[0.13em] font-heading">Guests</label>
                <input
                  value={editForm.attendees}
                  onChange={(e) => onEditFormChange({ attendees: e.target.value })}
                  placeholder="email@company.com, ..."
                  className="w-full text-[13px] bg-secondary/40 rounded-lg px-2.5 h-10 border border-border/40 focus:border-foreground/20 focus:outline-none transition-colors placeholder:text-muted-foreground/35"
                />
              </div>
            ) : (selected.attendees?.length ?? 0) > 0 ? (
              <div className="space-y-3">
                <p className="text-[9.5px] font-bold text-muted-foreground/50 uppercase tracking-[0.13em] flex items-center gap-1.5 font-heading">
                  <Users className="size-3.5 opacity-60" strokeWidth={1.75} />
                  Guests ({selected.attendees!.length})
                </p>
                <div className="space-y-2">
                  {selected.attendees!.map((a) => {
                    const initials = (a.displayName ?? a.email ?? "?")
                      .split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
                    const status = a.responseStatus ?? "";
                    const isAccepted = status === "accepted";
                    const isDeclined = status === "declined";
                    return (
                      <div key={a.email} className="flex items-center gap-2.5">
                        <div className={`size-6.5 flex items-center justify-center shrink-0 text-[9px] font-bold rounded-full ${isAccepted ? "bg-emerald-500/10 text-emerald-600" : isDeclined ? "bg-red-500/10 text-red-500" : "bg-secondary text-muted-foreground"}`}>
                          {initials}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold truncate leading-tight">{a.displayName ?? a.email}</p>
                          {a.displayName && <p className="text-[9.5px] text-muted-foreground/60 truncate leading-none mt-0.5">{a.email}</p>}
                        </div>
                        <span className={`text-[8.5px] font-bold shrink-0 px-2 py-0.5 rounded-full uppercase border ${isAccepted ? "text-emerald-500 bg-emerald-500/10 border-emerald-500/20" : isDeclined ? "text-red-400 bg-red-500/10 border-red-500/20" : "text-muted-foreground bg-muted border-border/30"}`}>
                          {RESPONSE_LABELS[status] ?? "Invited"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {/* GCal link */}
            {!editMode && selected.htmlLink && (
              <a
                href={selected.htmlLink}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-[10.5px] text-muted-foreground/60 hover:text-foreground transition-all duration-150 pt-2"
              >
                <ExternalLink className="size-3.5" strokeWidth={1.75} />
                Open in Google Calendar
              </a>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-border/40 shrink-0 bg-secondary/15">
          {editMode ? (
            <div className="flex gap-2">
              <button
                disabled={saving || !editForm.title.trim()}
                onClick={onSave}
                className="flex-1 h-9 text-[13px] font-semibold bg-foreground text-background rounded-lg hover:bg-foreground/90 disabled:opacity-35 active:scale-[0.98] transition-all duration-150 cursor-pointer shadow-sm"
              >
                {saving ? "Saving…" : "Save Changes"}
              </button>
              <button
                disabled={saving}
                onClick={onCancelEdit}
                className="h-9 px-4 text-[13px] font-semibold border border-border/60 rounded-lg text-foreground hover:bg-secondary disabled:opacity-35 transition-all duration-150 cursor-pointer"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={onStartEdit}
                className="flex-1 h-9 text-[13px] font-semibold border border-border/60 rounded-lg text-foreground hover:bg-secondary transition-all duration-150 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Pencil className="size-4" strokeWidth={1.75} />
                Edit
              </button>
              <button
                disabled={deleting}
                onClick={onDelete}
                className="flex-1 h-9 text-[13px] font-semibold rounded-lg border border-red-200/50 text-red-500/80 hover:text-red-500 hover:bg-red-500/10 disabled:opacity-35 transition-all duration-150 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="size-4" strokeWidth={1.75} />
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

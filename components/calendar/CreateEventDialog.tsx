"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogDescription, DialogTitle,
} from "@/components/ui/dialog";
import { RiCalendarEventLine, RiCloseLine, RiGroupLine, RiMapPinLine, RiTimeLine } from "@remixicon/react";
import type { CalendarInfo, CreateEventForm } from "@/types/calendar";
import { GCAL_DEFAULT } from "@/constants/calendar";

interface CreateEventDialogProps {
  open: boolean;
  form: CreateEventForm;
  calendars: CalendarInfo[];
  creating: boolean;
  onOpenChange: (open: boolean) => void;
  onFormChange: (patch: Partial<CreateEventForm>) => void;
  onCreate: () => void;
}

export default function CreateEventDialog({
  open,
  form,
  calendars,
  creating,
  onOpenChange,
  onFormChange,
  onCreate,
}: CreateEventDialogProps) {
  const handleClose = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-[460px] p-0 gap-0 overflow-hidden rounded-2xl border border-border/50 shadow-2xl bg-card font-sans select-none"
        showCloseButton={false}
      >
        {/* Dialog Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3 bg-secondary/20">
          <DialogTitle className="text-xl font-semibold text-foreground tracking-tight">New event</DialogTitle>
          <DialogDescription className="sr-only">Create a new event in Google Calendar</DialogDescription>
          <button
            onClick={handleClose}
            className="size-6 flex items-center justify-center rounded-lg text-muted-foreground/60 hover:text-foreground hover:bg-secondary transition-all cursor-pointer"
          >
            <RiCloseLine className="size-4" />
          </button>
        </div>

        {/* Form Body */}
        <div className="overflow-y-auto max-h-[calc(100vh-180px)]">
          <div className="px-6 pt-4 pb-3">
            <Input
              autoFocus
              placeholder="Event title"
              value={form.title}
              onChange={(e) => onFormChange({ title: e.target.value })}
              onKeyDown={(e) => e.key === "Enter" && !creating && onCreate()}
              className="h-10 text-[14px] font-medium placeholder:text-muted-foreground/35 border-0 border-b border-border/40 rounded-none px-0 focus-visible:ring-0 shadow-none focus:border-foreground/30 transition-colors bg-transparent font-heading"
            />
          </div>

          <div className="px-6 pb-4 space-y-4">
            {/* When */}
            <div className="space-y-2.5">
              <p className="text-[9.5px] font-bold uppercase tracking-[0.13em] text-muted-foreground/60 font-heading">When</p>

              <div className="flex items-center gap-3">
                <RiCalendarEventLine className="size-4 text-muted-foreground/50 shrink-0" />
                <Input
                  type="date"
                  value={form.date}
                  onChange={(e) => onFormChange({ date: e.target.value })}
                  className="flex-1 min-w-0 h-10 text-xs rounded-lg border border-border/40 bg-secondary/40 focus-visible:ring-0 focus:border-foreground/20"
                />
                <label className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground/80 cursor-pointer select-none shrink-0 hover:text-foreground transition-colors">
                  <input
                    type="checkbox"
                    checked={form.allDay}
                    onChange={(e) => onFormChange({ allDay: e.target.checked })}
                    className="size-3.5 accent-foreground cursor-pointer focus:outline-none"
                  />
                  All day
                </label>
              </div>

              {!form.allDay && (
                <div className="flex items-center gap-3">
                  <RiTimeLine className="size-4 text-muted-foreground/50 shrink-0" />
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <Input
                      type="time"
                      value={form.startTime}
                      onChange={(e) => onFormChange({ startTime: e.target.value })}
                      className="flex-1 min-w-0 h-10 text-xs rounded-lg border border-border/40 bg-secondary/40 focus-visible:ring-0 focus:border-foreground/20"
                    />
                    <span className="text-muted-foreground/35 text-xs shrink-0">→</span>
                    <Input
                      type="time"
                      value={form.endTime}
                      onChange={(e) => onFormChange({ endTime: e.target.value })}
                      className="flex-1 min-w-0 h-10 text-xs rounded-lg border border-border/40 bg-secondary/40 focus-visible:ring-0 focus:border-foreground/20"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-border/45" />

            {/* Details */}
            <div className="space-y-2.5">
              <p className="text-[9.5px] font-bold uppercase tracking-[0.13em] text-muted-foreground/60 font-heading">Details</p>

              {calendars.length > 0 && (
                <div className="flex items-center gap-3">
                  <span
                    className="size-3.5 shrink-0 rounded-full border border-border/20 shadow-sm"
                    style={{ backgroundColor: calendars.find((c) => c.id === form.calendarId)?.color ?? GCAL_DEFAULT }}
                  />
                  <select
                    value={form.calendarId}
                    onChange={(e) => onFormChange({ calendarId: e.target.value })}
                    className="flex-1 h-10 text-xs bg-secondary/40 border border-border/40 rounded-lg px-2.5 focus:outline-none focus:border-foreground/20 transition-colors cursor-pointer"
                  >
                    {calendars.map((cal) => (
                      <option key={cal.id} value={cal.id} className="bg-card">{cal.summary ?? cal.id}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex items-center gap-3">
                <RiMapPinLine className="size-4 text-muted-foreground/50 shrink-0" />
                <Input
                  placeholder="Add location"
                  value={form.location}
                  onChange={(e) => onFormChange({ location: e.target.value })}
                  className="flex-1 h-10 text-xs rounded-lg border border-border/40 bg-secondary/40 focus-visible:ring-0 focus:border-foreground/20 placeholder:text-muted-foreground/45"
                />
              </div>

              <div className="flex items-center gap-3">
                <RiGroupLine className="size-4 text-muted-foreground/50 shrink-0" />
                <Input
                  placeholder="Invite people (comma separated)"
                  value={form.attendees}
                  onChange={(e) => onFormChange({ attendees: e.target.value })}
                  className="flex-1 h-10 text-xs rounded-lg border border-border/40 bg-secondary/40 focus-visible:ring-0 focus:border-foreground/20 placeholder:text-muted-foreground/45"
                />
              </div>

              <Textarea
                placeholder="Add notes or agenda…"
                value={form.description}
                onChange={(e) => onFormChange({ description: e.target.value })}
                className="text-xs resize-none min-h-[72px] rounded-lg border border-border/40 bg-secondary/40 focus-visible:ring-0 focus:border-foreground/20 placeholder:text-muted-foreground/45 py-2 px-3"
              />
            </div>
          </div>
        </div>

        {/* Dialog Actions */}
        <div className="px-6 py-4 border-t border-border/30 flex items-center justify-end gap-2 bg-secondary/15">
          <button
            onClick={handleClose}
            className="h-9 px-4 text-xs font-semibold border border-border/60 rounded-lg text-foreground hover:bg-secondary transition-all duration-150 cursor-pointer"
          >
            Cancel
          </button>
          <button
            disabled={!form.title.trim() || creating}
            onClick={onCreate}
            className="h-9 px-4.5 text-xs font-semibold bg-primary text-primary-foreground rounded-lg hover:bg-primary/95 disabled:opacity-35 active:scale-[0.98] transition-all duration-150 cursor-pointer"
          >
            {creating ? "Creating…" : "Create Event"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

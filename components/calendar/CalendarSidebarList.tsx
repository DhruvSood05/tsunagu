"use client";

import type { CalendarInfo } from "@/types/calendar";
import { COLOR_SWATCHES } from "@/constants/calendar";
import { Calendar } from "@/components/ui/calendar";
import { MoreHorizontal } from "lucide-react";

interface CalendarSidebarListProps {
  calendars: CalendarInfo[];
  enabledCals: Set<string>;
  colorPickerFor: string | null;
  selectedDate: Date;
  onToggle: (id: string) => void;
  onColorChange: (id: string, hex: string) => void;
  onOpenColorPicker: (id: string | null) => void;
  onDateSelect: (date: Date) => void;
}

export default function CalendarSidebarList({
  calendars,
  enabledCals,
  colorPickerFor,
  selectedDate,
  onToggle,
  onColorChange,
  onOpenColorPicker,
  onDateSelect,
}: CalendarSidebarListProps) {
  return (
    <div className="w-60 shrink-0 border-r border-border/30 flex flex-col overflow-y-auto bg-background font-sans select-none">
      <div className="px-5 pt-5 pb-4">
        <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-muted-foreground/50 mb-3 font-heading">
          Calendars
        </p>

        {calendars.length === 0 ? (
          <div className="space-y-2.5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-2.5">
                <div className="size-3.5 rounded-full bg-muted/50 animate-pulse" />
                <div className="h-3 flex-1 bg-muted/40 animate-pulse rounded" />
              </div>
            ))}
          </div>
        ) : (
          <ul className="space-y-0.5">
            {calendars.map((cal) => {
              const on = enabledCals.has(cal.id);
              const pickerOpen = colorPickerFor === cal.id;
              return (
                <li key={cal.id}>
                  <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-md hover:bg-secondary/60 transition-colors duration-100 group">
                    {/* Circle dot toggle — filled when enabled, outline when disabled */}
                    <button
                      type="button"
                      onClick={() => onToggle(cal.id)}
                      className="size-3.5 shrink-0 rounded-full transition-all duration-150 focus:outline-none cursor-pointer"
                      style={{
                        backgroundColor: on ? cal.color : "transparent",
                        border: `2px solid ${cal.color}`,
                        opacity: on ? 1 : 0.45,
                      }}
                    />

                    <span
                      onClick={() => onToggle(cal.id)}
                      className="text-[12px] truncate flex-1 font-medium cursor-pointer transition-opacity duration-150 text-foreground"
                      style={{ opacity: on ? 1 : 0.45 }}
                    >
                      {cal.summary ?? cal.id}
                    </span>

                    {/* Color picker trigger — only visible on hover */}
                    <button
                      type="button"
                      title="Options"
                      onClick={() => onOpenColorPicker(pickerOpen ? null : cal.id)}
                      className="size-5 shrink-0 flex items-center justify-center rounded opacity-0 group-hover:opacity-50 hover:opacity-100! hover:bg-secondary transition-all text-muted-foreground cursor-pointer"
                    >
                      <MoreHorizontal className="size-3.5" strokeWidth={1.75} />
                    </button>
                  </div>

                  {pickerOpen && (
                    <div className="mx-2 mb-2 mt-1">
                      <div className="flex flex-wrap gap-1.5 p-2.5 bg-card rounded-lg border border-border/40 shadow-md">
                        {COLOR_SWATCHES.map((hex) => (
                          <button
                            key={hex}
                            type="button"
                            title={hex}
                            onClick={() => onColorChange(cal.id, hex)}
                            className="size-4 rounded-full transition-transform hover:scale-110 focus:outline-none cursor-pointer"
                            style={{
                              backgroundColor: hex,
                              boxShadow:
                                cal.color === hex
                                  ? `0 0 0 2px var(--card), 0 0 0 3.5px ${hex}`
                                  : undefined,
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Mini date picker — navigate the main calendar by clicking a day */}
      <div className="px-2 pb-4 pt-2 border-t border-border/30">
        <Calendar
          mode="single"
          selected={selectedDate}
          month={selectedDate}
          onSelect={(date) => date && onDateSelect(date)}
          onMonthChange={onDateSelect}
          showOutsideDays
          className="w-full p-2 [--cell-size:1.92rem]"
        />
      </div>
    </div>
  );
}

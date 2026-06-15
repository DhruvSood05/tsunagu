"use client";

import { RiAddLine, RiArrowLeftSLine, RiArrowRightSLine } from "@remixicon/react";
import { CALENDAR_VIEWS } from "@/constants/calendar";
import type { CalendarView } from "@/types/calendar";

interface CalendarToolbarProps {
  title: string;
  view: CalendarView;
  loading: boolean;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  onChangeView: (view: CalendarView) => void;
  onNewEvent: () => void;
}

export default function CalendarToolbar({
  title,
  view,
  loading,
  onPrev,
  onNext,
  onToday,
  onChangeView,
  onNewEvent,
}: CalendarToolbarProps) {
  return (
    <header className="flex items-center justify-between px-6 h-14 border-b border-border/30 shrink-0 gap-4 bg-card select-none font-sans">
      {/* Left: nav + today + title */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex items-center gap-0.5">
          <button
            onClick={onPrev}
            className="size-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors duration-150 cursor-pointer"
          >
            <RiArrowLeftSLine className="size-4.5" />
          </button>
          <button
            onClick={onNext}
            className="size-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors duration-150 cursor-pointer"
          >
            <RiArrowRightSLine className="size-4.5" />
          </button>
        </div>

        <button
          onClick={onToday}
          className="text-[11px] font-medium text-muted-foreground hover:text-foreground px-2.5 h-6.5 rounded-md border border-border/50 hover:bg-secondary transition-all duration-150 cursor-pointer"
        >
          Today
        </button>

        <div className="flex items-center gap-2">
          <h1 className="text-lg font-serif text-foreground tracking-tight leading-none">{title}</h1>
          {loading && (
            <div className="size-3 rounded-full border-[1.5px] border-muted-foreground/20 border-t-muted-foreground/55 animate-spin shrink-0" />
          )}
        </div>
      </div>

      {/* Right: view switcher + new event */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Flat tab-style view switcher */}
        <div className="flex items-center gap-1 p-1 bg-background border border-border/50 rounded-lg">
          {CALENDAR_VIEWS.map(({ key, label }) => {
            const isActive = view === key;
            return (
              <button
                key={key}
                onClick={() => onChangeView(key)}
                className={`text-[11px] font-semibold px-3 py-1 rounded-md transition-all duration-200 cursor-pointer ${
                  isActive
                    ? "bg-card text-foreground shadow-sm border border-border/60"
                    : "text-muted-foreground hover:text-foreground hover:bg-card/50 border border-transparent"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* New Event — foreground-fill button */}
        <button
          onClick={onNewEvent}
          className="flex items-center gap-1.5 h-8 px-4 bg-foreground text-background text-[11px] font-semibold rounded-md hover:bg-foreground/85 active:scale-[0.97] transition-all duration-150 cursor-pointer"
        >
          <RiAddLine className="size-3.5" />
          New Event
        </button>
      </div>
    </header>
  );
}

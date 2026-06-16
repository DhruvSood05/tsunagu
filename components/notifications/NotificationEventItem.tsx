"use client";

import { RiCalendarEventLine, RiMapPinLine, RiGroupLine } from "@remixicon/react";
import { PRIORITY_BADGE, eventTimeLabel, type NotificationEvent, type Priority } from "./notification-utils";

interface NotificationEventItemProps {
  event: NotificationEvent;
  onClick: () => void;
}

export default function NotificationEventItem({ event, onClick }: NotificationEventItemProps) {
  const priority = (event.priority ?? "medium") as Priority;
  return (
    <button
      onClick={onClick}
      className="group w-full flex items-start gap-2.5 px-2.5 py-2 rounded-lg text-left hover:bg-secondary/70 transition-colors duration-100 cursor-pointer"
    >
      <div className="size-6 rounded-md bg-foreground/5 flex items-center justify-center shrink-0 mt-0.5">
        <RiCalendarEventLine className="size-3.5 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-[11px] font-semibold text-foreground truncate flex-1 group-hover:text-foreground transition-colors">
            {event.summary}
          </p>
          <span className={`shrink-0 text-[8px] font-bold font-mono uppercase tracking-widest px-1.5 py-0.5 rounded-full border leading-none ${PRIORITY_BADGE[priority]}`}>
            {priority}
          </span>
        </div>
        <div className="flex items-center gap-2.5 mt-0.5 text-[10px] text-muted-foreground/70">
          <span className="font-mono font-medium text-foreground/70">{eventTimeLabel(event)}</span>
          {event.location && (
            <span className="flex items-center gap-0.5 truncate">
              <RiMapPinLine className="size-2.5 shrink-0" />
              <span className="truncate">{event.location}</span>
            </span>
          )}
          {event.attendeesCount > 0 && (
            <span className="flex items-center gap-0.5 shrink-0">
              <RiGroupLine className="size-2.5" />
              {event.attendeesCount}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

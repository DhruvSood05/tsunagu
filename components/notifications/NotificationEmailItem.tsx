"use client";

import { RiMailLine } from "@remixicon/react";
import { PRIORITY_BADGE, parseSenderName, type NotificationEmail } from "./notification-utils";

interface NotificationEmailItemProps {
  email: NotificationEmail;
  onClick: () => void;
}

export default function NotificationEmailItem({ email, onClick }: NotificationEmailItemProps) {
  return (
    <button
      onClick={onClick}
      className="group w-full flex items-start gap-2.5 px-2.5 py-2 rounded-lg text-left hover:bg-secondary/70 transition-colors duration-100 cursor-pointer"
    >
      <div className="size-6 rounded-md bg-foreground/5 flex items-center justify-center shrink-0 mt-0.5">
        <RiMailLine className="size-3.5 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          {email.unread && <span className="size-1.5 rounded-full bg-foreground shrink-0" />}
          <p className={`text-[11px] truncate flex-1 ${email.unread ? "font-bold text-foreground" : "font-semibold text-foreground/80"}`}>
            {parseSenderName(email.from)}
          </p>
          <span className={`shrink-0 text-[8px] font-bold font-mono uppercase tracking-widest px-1.5 py-0.5 rounded-full border leading-none ${PRIORITY_BADGE[email.priority]}`}>
            {email.priority}
          </span>
        </div>
        <p className="text-[11px] text-foreground/70 truncate mt-0.5 group-hover:text-foreground transition-colors">{email.subject}</p>
        <p className="text-[10px] text-muted-foreground/60 truncate mt-0.5">{email.snippet}</p>
      </div>
    </button>
  );
}

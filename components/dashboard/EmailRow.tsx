"use client";

import { useState } from "react";
import { getHeader } from "@/lib/email";
import { RiStarFill, RiStarLine } from "@remixicon/react";

interface EmailRowProps {
  email: any;
  selected: boolean;
  checked: boolean;
  onClick: () => void;
  onCheck: (checked: boolean) => void;
}

export default function EmailRow({ email, selected, checked, onClick, onCheck }: EmailRowProps) {
  const isUnread = email.labelIds?.includes("UNREAD");
  const [starred, setStarred] = useState(email.labelIds?.includes("STARRED") ?? false);

  const from = getHeader(email, "From");
  const subject = getHeader(email, "Subject");
  const date = getHeader(email, "Date");

  const senderName = from.replace(/<[^>]*>/g, "").trim() || from;
  const initials = senderName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2) || "?";

  function formatRelativeDate(email: any): string {
    const raw = email.internalDate
      ? new Date(Number(email.internalDate))
      : date ? new Date(date) : null;
    if (!raw || isNaN(raw.getTime())) return "";
    const d = raw;
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfYesterday = new Date(startOfToday.getTime() - 86400000);
    const sixDaysAgo = new Date(startOfToday.getTime() - 6 * 86400000);

    if (d >= startOfToday) return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
    if (d >= startOfYesterday) return "Yesterday";
    if (d >= sixDaysAgo) return d.toLocaleDateString("en-US", { weekday: "short" });
    if (d.getFullYear() === now.getFullYear()) return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }

  const formattedDate = formatRelativeDate(email);

  const handleCheck = (e: React.MouseEvent) => {
    e.stopPropagation();
    onCheck(!checked);
  };

  const handleStar = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const next = !starred;
    setStarred(next);
    try {
      await fetch(`/api/emails/${email.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          next ? { addLabelIds: ["STARRED"] } : { removeLabelIds: ["STARRED"] }
        ),
      });
    } catch {
      setStarred(!next);
    }
  };

  return (
    <div
      onClick={onClick}
      className={`group flex items-start gap-2.5 px-3 py-3 cursor-pointer border-b border-border/60 transition-colors ${
        selected
          ? "bg-primary/5 border-l-2 border-l-primary"
          : "hover:bg-muted/50 border-l-2 border-l-transparent"
      }`}
    >
      {/* Checkbox + unread dot column */}
      <div className="flex items-center justify-center pt-1 shrink-0">
        <div className="relative size-4 flex items-center justify-center">
          <span
            className={`size-1.5 rounded-full absolute transition-opacity pointer-events-none ${
              isUnread ? "bg-primary" : "bg-transparent"
            } ${checked ? "opacity-0" : "opacity-100 group-hover:opacity-0"}`}
          />
          <input
            type="checkbox"
            checked={checked}
            onClick={handleCheck}
            onChange={() => {}}
            className={`size-3.5 cursor-pointer absolute accent-primary transition-opacity ${
              checked ? "opacity-100" : "opacity-0 group-hover:opacity-100"
            }`}
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1.5 mb-0.5">
          <span
            className={`text-xs truncate ${
              isUnread ? "font-semibold text-foreground" : "font-medium text-muted-foreground"
            }`}
          >
            {senderName || "(unknown)"}
          </span>
          <div className="flex items-center gap-1 shrink-0">
            <span className="text-[10px] text-muted-foreground">{formattedDate}</span>
            <button
              onClick={handleStar}
              className={`p-0.5 rounded transition-opacity focus:outline-none ${
                starred ? "opacity-100" : "opacity-0 group-hover:opacity-100"
              }`}
              title={starred ? "Remove star" : "Star"}
            >
              {starred ? (
                <RiStarFill className="size-3.5 text-amber-400" />
              ) : (
                <RiStarLine className="size-3.5 text-muted-foreground" />
              )}
            </button>
          </div>
        </div>
        <p
          className={`text-xs truncate ${
            isUnread ? "font-medium text-foreground" : "text-muted-foreground"
          }`}
        >
          {subject || "(no subject)"}
        </p>
        <p className="text-[10px] text-muted-foreground truncate mt-0.5 leading-relaxed">
          {email.snippet}
        </p>
      </div>
    </div>
  );
}

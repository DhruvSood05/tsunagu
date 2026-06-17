"use client";

import { useState } from "react";
import { getHeader } from "@/lib/email";
import { Star, Check } from "lucide-react";

interface EmailRowProps {
  email: any;
  selected: boolean;
  checked: boolean;
  priority?: "high" | "medium" | "low" | null;
  onClick: () => void;
  onCheck: (checked: boolean) => void;
}

// Warm editorial monochrome — subtle ink-on-paper tints that sit quietly
// against the warm canvas, with gentle depth between senders.
const AVATAR_PALETTE = [
  "bg-foreground/[0.05] text-foreground/75 border border-border/60",
  "bg-foreground/[0.08] text-foreground/80 border border-border/60",
  "bg-foreground/[0.04] text-foreground/70 border border-border/50",
  "bg-foreground/[0.07] text-foreground/80 border border-border/60",
];

function senderColorClass(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) | 0;
  return AVATAR_PALETTE[Math.abs(h) % AVATAR_PALETTE.length];
}

const PRIORITY_STYLES: Record<string, string> = {
  high: "text-rose-500 bg-rose-500/10 border-rose-500/20",
  medium: "text-amber-500 bg-amber-500/10 border-amber-500/20",
  low: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
};

export default function EmailRow({ email, selected, checked, priority, onClick, onCheck }: EmailRowProps) {
  const isUnread = email.labelIds?.includes("UNREAD");
  const [starred, setStarred] = useState(email.labelIds?.includes("STARRED") ?? false);

  const from = getHeader(email, "From");
  const subject = getHeader(email, "Subject");
  const date = getHeader(email, "Date");

  const senderName = from.replace(/<[^>]*>/g, "").trim() || from;
  const initials = senderName
    .split(" ")
    .map((n: string) => n[0])
    .filter(Boolean)
    .join("")
    .toUpperCase()
    .slice(0, 1) || "?";

  const avatarColor = senderColorClass(senderName);

  function formatRelativeDate(): string {
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

  const formattedDate = formatRelativeDate();

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

  const badges: { label: string; cls: string }[] = [];
  if (email.labelIds?.includes("IMPORTANT"))
    badges.push({ label: "priority", cls: "text-pink-500 bg-pink-500/10 border-pink-500/20" });
  if (email.labelIds?.includes("CATEGORY_UPDATES"))
    badges.push({ label: "update", cls: "text-violet-500 bg-violet-500/10 border-violet-500/20" });
  if (email.labelIds?.includes("CATEGORY_PROMOTIONS"))
    badges.push({ label: "promo", cls: "text-orange-400 bg-orange-400/10 border-orange-400/20" });
  if (email.labelIds?.includes("CATEGORY_SOCIAL"))
    badges.push({ label: "social", cls: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20" });

  return (
    <div
      onClick={onClick}
      className={`group relative flex items-center gap-3 px-4 py-3.5 cursor-pointer border-b border-border transition-all duration-150 select-none font-sans ${
        selected
          ? "bg-secondary dark:bg-[#1a1a1c] border-l-2 border-l-primary z-10 shadow-[0_1px_3px_rgba(0,0,0,0.1)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.2)]"
          : "bg-background hover:bg-foreground/5 dark:hover:bg-[#202022] border-l-2 border-l-transparent"
      } ${!isUnread && !selected ? "opacity-70 hover:opacity-100" : ""}`}
    >
      <div className="shrink-0 flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          role="checkbox"
          aria-checked={checked}
          onClick={() => onCheck(!checked)}
          className={`size-4.5 rounded-[4px] flex items-center justify-center border-[1.5px] transition-all duration-150 focus:outline-none cursor-pointer shadow-sm ${
            checked 
              ? "bg-foreground border-foreground text-background" 
              : "border-muted-foreground/40 bg-card hover:border-foreground/60"
          }`}
        >
          {checked && <Check className="size-3" strokeWidth={3} />}
        </button>
      </div>

      {/* Sender avatar */}
      <div className={`size-8 shrink-0 flex items-center justify-center rounded-full text-[11px] font-bold leading-none ${avatarColor}`}>
        {initials}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 space-y-0.5">
        {/* Sender + date */}
        <div className="flex items-baseline justify-between gap-3">
          <span className={`text-[13px] font-heading truncate leading-tight ${
            isUnread ? "font-semibold text-foreground" : "font-medium text-foreground"
          }`}>
            {senderName || "(unknown)"}
          </span>
          <span className="text-[10px] text-muted-foreground font-mono tabular-nums shrink-0">
            {formattedDate}
          </span>
        </div>

        {/* Subject */}
        <p className={`text-[13px] font-heading truncate leading-snug ${
          isUnread ? "font-semibold text-foreground/90" : "font-normal text-secondary-foreground"
        }`}>
          {subject || "(no subject)"}
        </p>

        {/* Snippet + badges */}
        <div className="flex items-center gap-2 mt-0.5">
          <p className="text-[12px] font-email font-normal text-muted-foreground truncate leading-relaxed flex-1 min-w-0">
            {email.snippet}
          </p>
          {(badges.length > 0 || priority) && (
            <div className="flex gap-1 shrink-0">
              {priority && (
                <span className={`text-[9px] font-bold font-mono tracking-widest uppercase px-1.5 py-0.5 rounded-full border leading-none ${PRIORITY_STYLES[priority]}`}>
                  {priority}
                </span>
              )}
              {badges.map((b, i) => (
                <span
                  key={i}
                  className={`text-[9px] font-bold font-mono tracking-widest uppercase px-1.5 py-0.5 rounded-full border leading-none ${b.cls}`}
                >
                  {b.label}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Star — always visible, extreme right */}
      <button
        onClick={handleStar}
        className="shrink-0 focus:outline-none cursor-pointer"
        title={starred ? "Remove star" : "Star"}
      >
        <Star 
          className={`size-4 transition-colors duration-150 ${
            starred 
              ? "text-amber-400 fill-amber-400" 
              : "text-muted-foreground/20 hover:text-amber-400"
          }`}
          strokeWidth={1.5}
        />
      </button>
    </div>
  );
}

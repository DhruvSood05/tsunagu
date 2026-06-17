"use client";

import {
  RiSparkling2Fill,
  RiAlertLine,
  RiArrowRightUpLine,
} from "@remixicon/react";

interface AISummaryCardProps {
  summary: string;
  priority: string;
  category?: string;
  followUp?: boolean;
  followUpReason?: string;
  suggestedReplies?: { label: string; draftPrompt: string }[];
  onSuggestedReplyClick: (draftPrompt: string) => void;
  replyGenerating: boolean;
}

const PRIORITY_STYLE: Record<string, string> = {
  high:   "bg-rose-500/10 text-rose-500 border-rose-500/20",
  medium: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  low:    "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
};

export default function AISummaryCard({
  summary,
  priority,
  category,
  followUp,
  followUpReason,
  suggestedReplies,
  onSuggestedReplyClick,
  replyGenerating,
}: AISummaryCardProps) {
  return (
    <div className="rounded-xl border border-primary/20 bg-card shadow-sm font-sans select-none animate-in fade-in duration-200 overflow-hidden">

      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-3 px-5 py-3.5 border-b border-border/30 bg-primary/4">
        <div className="flex items-center gap-2.5">
          <div className="size-7 rounded-lg bg-primary/12 flex items-center justify-center shrink-0">
            <RiSparkling2Fill className="size-3.5 text-primary" />
          </div>
          <span className="text-sm font-semibold text-foreground tracking-tight">AI Summary</span>
        </div>

        {/* Priority + category pills */}
        <div className="flex items-center gap-1.5 flex-wrap justify-end">
          <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border leading-none capitalize ${PRIORITY_STYLE[priority] ?? "bg-secondary text-muted-foreground border-border/40"}`}>
            {priority}
          </span>
          {category && (
            <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full border leading-none bg-primary/10 text-primary border-primary/20 capitalize">
              {category}
            </span>
          )}
        </div>
      </div>

      {/* ── Summary text ── */}
      <div className="px-5 py-4">
        <p className="text-[13.5px] text-foreground/85 leading-relaxed">
          {summary}
        </p>
      </div>

      {/* ── Follow-up banner ── */}
      {followUp && (
        <div className="mx-5 mb-4 flex items-start gap-2.5 px-4 py-3 rounded-xl bg-amber-500/8 border border-amber-500/20">
          <RiAlertLine className="size-4 text-amber-500 shrink-0 mt-px" />
          <p className="text-[12.5px] text-amber-600 dark:text-amber-400 leading-snug">
            <span className="font-bold">Follow-up needed: </span>
            {followUpReason}
          </p>
        </div>
      )}

      {/* ── Suggested replies ── */}
      {suggestedReplies && suggestedReplies.length > 0 && (
        <div className="px-5 pb-5 pt-1 space-y-2.5 border-t border-border/30">
          <p className="text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-widest pt-4 pb-0.5">
            Suggested replies
          </p>
          <div className="flex flex-col gap-2">
            {suggestedReplies.map((reply, idx) => (
              <button
                key={idx}
                onClick={() => onSuggestedReplyClick(reply.draftPrompt)}
                disabled={replyGenerating}
                className="group w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl border border-border/50 bg-secondary/40 hover:bg-secondary hover:border-border transition-all duration-150 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <div className="size-6 rounded-lg bg-primary/10 border border-primary/15 flex items-center justify-center shrink-0 group-hover:bg-primary/15 transition-colors">
                  <RiSparkling2Fill className="size-3 text-primary" />
                </div>
                <span className="flex-1 text-[13px] font-medium text-foreground leading-snug">
                  {reply.label}
                </span>
                <RiArrowRightUpLine className="size-3.5 text-muted-foreground/30 shrink-0 group-hover:text-primary/60 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-150" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

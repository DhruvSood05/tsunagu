"use client";

import {
  RiSparkling2Fill,
  RiSparkling2Line,
  RiAlertLine,
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
    <div className="rounded-lg border border-border/45 bg-secondary/40 p-5 space-y-4 shadow-sm font-sans select-none animate-in fade-in duration-200">
      {/* AI Header & Tags */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <RiSparkling2Fill className="size-4 text-[#8b5cf6] animate-pulse" />
          <span className="text-[10px] font-bold tracking-widest text-[#8b5cf6] uppercase font-heading">AI Summary</span>
        </div>
        
        {/* Meta Badges */}
        <div className="flex items-center gap-1.5">
          <span className={`text-[9px] font-bold font-mono tracking-wider uppercase px-2 py-0.5 rounded-lg leading-none border ${
            priority === "high"
              ? "bg-[#ec4899]/15 text-[#ec4899] border-[#ec4899]/25"
              : priority === "medium"
              ? "bg-[#fb923c]/15 text-[#fb923c] border-[#fb923c]/25"
              : "bg-secondary text-muted-foreground border-border/30"
          }`}>
            {priority} priority
          </span>
          {category && (
            <span className={`text-[9px] font-bold font-mono tracking-wider uppercase px-2 py-0.5 rounded-lg leading-none border ${
              category.toLowerCase().includes("social")
                ? "bg-[#34d399]/15 text-[#34d399] border-[#34d399]/25"
                : category.toLowerCase().includes("promo")
                ? "bg-[#fb923c]/15 text-[#fb923c] border-[#fb923c]/25"
                : "bg-[#8b5cf6]/15 text-[#8b5cf6] border-[#8b5cf6]/25"
            }`}>
              {category}
            </span>
          )}
        </div>
      </div>

      {/* Summary text */}
      <p className="text-xs text-foreground/90 leading-relaxed font-medium">
        {summary}
      </p>

      {/* Follow-up reminder */}
      {followUp && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-[#ec4899]/5 border border-[#ec4899]/15 text-[#ec4899] text-xs">
          <RiAlertLine className="size-3.5 shrink-0 mt-0.5" />
          <p className="text-[11px] leading-tight">
            <span className="font-bold uppercase tracking-wider text-[9px] mr-1">Follow-up:</span> 
            {followUpReason}
          </p>
        </div>
      )}

      {/* Quick AI Response Actions */}
      {suggestedReplies && suggestedReplies.length > 0 && (
        <div className="space-y-2 pt-3 border-t border-border/40">
          <p className="text-[9px] font-bold tracking-widest text-muted-foreground/60 uppercase font-heading">Suggested replies</p>
          <div className="flex flex-wrap gap-2">
            {suggestedReplies.map((reply, idx) => (
              <button
                key={idx}
                onClick={() => onSuggestedReplyClick(reply.draftPrompt)}
                disabled={replyGenerating}
                className="text-left text-xs font-semibold text-foreground hover:bg-secondary border border-border/50 bg-background px-3.5 py-1.8 rounded-lg transition-all duration-150 cursor-pointer disabled:opacity-50 inline-flex items-center gap-1.5"
              >
                <RiSparkling2Line className="size-3 text-[#8b5cf6]" />
                {reply.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

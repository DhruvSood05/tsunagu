"use client";

import { useState, useEffect } from "react";
import {
  RiMailSendLine,
  RiDraftLine,
  RiCheckLine,
  RiLoaderLine,
  RiAlertLine,
  RiPencilLine,
  RiMailLine,
  RiAtLine,
  RiFileTextLine,
  RiDeleteBinLine,
  RiMore2Fill,
  RiEmotionHappyLine,
  RiAttachment2,
  RiCalendarEventLine,
  RiLink,
} from "@remixicon/react";
import type { ChatArtifact } from "@/types/ai";

type EmailArtifact = Extract<ChatArtifact, { kind: "email" }>;
type CardStatus = "idle" | "sending" | "saving" | "sent" | "saved" | "error";

export default function EmailDraftCard({ email }: { email: EmailArtifact }) {
  const [to, setTo] = useState(email.to ?? "");
  const [subject, setSubject] = useState(email.subject ?? "");
  const [body, setBody] = useState(email.body ?? "");
  const [status, setStatus] = useState<CardStatus>(
    email.status === "sent" ? "sent" : "idle",
  );
  const [errorMsg, setErrorMsg] = useState("");

  // Sync state with streaming props
  useEffect(() => {
    setTo(email.to ?? "");
    setSubject(email.subject ?? "");
    setBody(email.body ?? "");
  }, [email.to, email.subject, email.body]);

  const locked = status === "sent" || status === "saved";
  const busy = status === "sending" || status === "saving";

  async function submit(action: "send" | "draft") {
    if (busy || locked) return;
    setStatus(action === "send" ? "sending" : "saving");
    setErrorMsg("");
    try {
      const res = await fetch("/api/ai/email-action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, to, subject, body }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error ?? "Request failed");
      setStatus(action === "send" ? "sent" : "saved");
    } catch (err: any) {
      setErrorMsg(err?.message ?? "Something went wrong");
      setStatus("error");
    }
  }

  /* ── Accent color per state ── */
  const accent = (() => {
    if (status === "sent") return { badge: "text-[#065F46] dark:text-[#6EE7B7] bg-[#D1FAE5] dark:bg-[#064E3B] border-[#A7F3D0] dark:border-[#047857]", dot: "bg-[#10B981] dark:bg-[#34D399]" };
    if (status === "saved") return { badge: "text-[#0369A1] dark:text-[#7DD3FC] bg-[#E0F2FE] dark:bg-[#0C4A6E] border-[#BAE6FD] dark:border-[#0284C7]", dot: "bg-[#0EA5E9] dark:bg-[#38BDF8]" };
    return { badge: "text-[#4C1D95] dark:text-[#DDD6FE] bg-[#F8F8F8] dark:bg-[#222222] border-[#ECECEC] dark:border-[#333333]", dot: "bg-[#8B5CF6] dark:bg-[#A78BFA]" };
  })();

  const badgeText = status === "sent" ? "Delivered" : status === "saved" ? "In Drafts" : "AI Generated Draft";

  return (
    <div className="mt-4 rounded-[16px] bg-[#FFFFFF] dark:bg-[#111111] overflow-hidden shadow-sm hover:shadow transition-shadow duration-300 animate-in fade-in slide-in-from-bottom-2 w-full max-w-[650px] mx-auto border border-[#ECECEC] dark:border-[#333333]">
      <div className="flex flex-col relative min-h-[300px]">
        
        {/* ── Metadata Rows ── */}
        <div className="px-6 flex flex-col pt-1">

          <div className="flex items-center gap-4 border-b border-[#ECECEC] dark:border-[#333333] py-3">
            <span className="text-[13px] font-medium text-[#666666] dark:text-[#A1A1AA] w-14 shrink-0">To</span>
            {locked ? (
              <span className="text-[14px] text-[#111111] dark:text-[#FAFAF8] truncate">{to || "—"}</span>
            ) : (
              <input type="email" value={to} onChange={(e) => setTo(e.target.value)} disabled={busy}
                placeholder="recipient@example.com" className="flex-1 text-[14px] text-[#111111] dark:text-[#FAFAF8] bg-transparent outline-none placeholder:text-[#999999] dark:placeholder:text-[#666666]" />
            )}
            {/* AI Draft Badge */}
            <div className={`ml-auto inline-flex items-center gap-1.5 text-[11px] font-medium text-[#666666] dark:text-[#A1A1AA] px-2.5 py-0.5 rounded-full border ${accent.badge} shrink-0`}>
              ✨ {badgeText}
            </div>
          </div>

          {/* ── Subject ── */}
          <div className="flex items-center gap-4 border-b border-[#ECECEC] dark:border-[#333333] py-3">
            <span className="text-[13px] font-medium text-[#666666] dark:text-[#A1A1AA] w-14 shrink-0">Subject</span>
            {locked ? (
              <span className="text-[14px] text-[#111111] dark:text-[#FAFAF8]">{subject || "(No subject)"}</span>
            ) : (
              <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)} disabled={busy}
                placeholder="Subject" className="flex-1 text-[14px] text-[#111111] dark:text-[#FAFAF8] bg-transparent outline-none placeholder:text-[#999999] dark:placeholder:text-[#666666]" />
            )}
          </div>
        </div>

        {/* ── Email Body (Document Style) ── */}
        <div className="relative flex-1 flex flex-col px-6 pt-5 pb-6">
          {locked ? (
            <div className="text-[14px] leading-[1.7] text-[#111111] dark:text-[#D4D4D8] whitespace-pre-wrap">
              {body || "(Empty body)"}
            </div>
          ) : (
            <textarea value={body} onChange={(e) => setBody(e.target.value)} disabled={busy}
              placeholder="Write your email..."
              className="w-full h-full min-h-[160px] text-[14px] leading-[1.7] text-[#111111] dark:text-[#D4D4D8] bg-transparent outline-none resize-none placeholder:text-[#999999] dark:placeholder:text-[#666666] disabled:opacity-50" />
          )}
        </div>

        {/* ── Error ── */}
        {status === "error" && (
          <div className="mx-6 mb-4 flex items-center gap-2.5 text-[13px] text-[#B91C1C] dark:text-[#F87171] bg-[#FEF2F2] dark:bg-[#451A1A] border border-[#FECACA] dark:border-[#7F1D1D] rounded-[12px] px-4 py-3">
            <RiAlertLine className="size-4 shrink-0" />
            <span className="font-medium">{errorMsg || "Failed to process request. Please try again."}</span>
          </div>
        )}

        {/* ── Footer Actions ── */}
        <div className="px-5 py-3.5 flex items-center justify-between mt-auto bg-[#F8F8F8] dark:bg-[#1A1A1A] border-t border-[#ECECEC] dark:border-[#333333]">
          
          <div className="flex items-center gap-4 mr-auto">
            {locked && (
              <span className="text-[13px] text-[#666666] dark:text-[#A1A1AA] font-medium">
                {status === "sent" ? "Email sent successfully" : "Saved to drafts"}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            {!locked && (
              <>
                <button onClick={() => submit("draft")} disabled={busy || !to.trim()}
                  className="inline-flex items-center justify-center px-4 py-2 text-[13.5px] font-medium rounded-[10px] text-[#666666] dark:text-[#A1A1AA] bg-transparent border border-transparent hover:border-[#ECECEC] dark:hover:border-[#333333] hover:bg-[#FFFFFF] dark:hover:bg-[#141414] hover:text-[#111111] dark:hover:text-[#FAFAF8] disabled:opacity-50 transition-all duration-200 cursor-pointer shadow-sm">
                  {status === "saving" ? <RiLoaderLine className="size-4 animate-spin mr-2" /> : null}
                  {status === "saving" ? "Saving..." : "Save Draft"}
                </button>
                <button onClick={() => submit("send")} disabled={busy || !to.trim()}
                  className="inline-flex items-center justify-center px-5 py-2 text-[13.5px] font-medium rounded-[10px] bg-[#111111] dark:bg-[#FAFAF8] text-[#FFFFFF] dark:text-[#111111] hover:bg-[#222222] dark:hover:bg-[#E5E7EB] disabled:opacity-50 transition-all duration-200 cursor-pointer shadow-sm">
                  {status === "sending" ? <RiLoaderLine className="size-4 animate-spin mr-2" /> : <RiMailSendLine className="size-4 mr-2" />}
                  {status === "sending" ? "Sending..." : "Send now"}
                </button>
              </>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

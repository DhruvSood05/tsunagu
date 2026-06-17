"use client";

import { useState, useEffect, useRef } from "react";
import {
  Send,
  FileText,
  Loader2,
  AlertCircle,
  CheckCheck,
  X,
  Plus,
  Pencil,
} from "lucide-react";
import type { ChatArtifact } from "@/types/ai";

function parseRecipient(raw: string): { name: string; email: string } {
  const match = raw.match(/^(.+?)\s*<([^>]+)>$/);
  if (match) return { name: match[1].trim(), email: match[2].trim() };
  return { name: "", email: raw.trim() };
}

function RecipientChip({
  value,
  onChange,
  disabled,
  locked,
}: {
  value: string;
  onChange: (v: string) => void;
  disabled: boolean;
  locked: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setDraft(value); }, [value]);

  const { name, email } = parseRecipient(value);
  const displayName = name || email;

  function commit() {
    onChange(draft.trim() || value);
    setEditing(false);
  }

  if (locked) {
    return <span className="text-[13px] text-foreground leading-relaxed">{displayName || "—"}</span>;
  }

  if (!editing && value.trim()) {
    return (
      <div className="flex items-center gap-1 flex-wrap">
        <span
          onClick={() => { if (!disabled) { setEditing(true); setTimeout(() => inputRef.current?.focus(), 0); } }}
          className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-ai/10 border border-ai/20 text-[12px] font-medium text-foreground cursor-pointer hover:bg-ai/15 transition-colors"
        >
          {displayName}
          {email && name && <span className="text-muted-foreground/60 font-normal">{email}</span>}
          {!disabled && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onChange(""); }}
              className="ml-0.5 text-muted-foreground/50 hover:text-foreground transition-colors cursor-pointer"
            >
              <X className="size-3" strokeWidth={2.5} />
            </button>
          )}
        </span>
      </div>
    );
  }

  return (
    <input
      ref={inputRef}
      type="text"
      value={editing ? draft : value}
      onChange={(e) => editing ? setDraft(e.target.value) : onChange(e.target.value)}
      onFocus={() => { setEditing(true); setDraft(value); }}
      onBlur={commit}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); commit(); } }}
      disabled={disabled}
      placeholder="recipient@example.com"
      className="w-full text-[13px] text-foreground bg-transparent outline-none placeholder:text-muted-foreground/40 disabled:opacity-50 caret-ai"
    />
  );
}

type EmailArtifact = Extract<ChatArtifact, { kind: "email" }>;
type CardStatus = "idle" | "sending" | "saving" | "sent" | "saved" | "error";

export default function EmailDraftCard({ email }: { email: EmailArtifact }) {
  const [to, setTo] = useState(email.to ?? "");
  const [cc, setCc] = useState("");
  const [showCc, setShowCc] = useState(false);
  const [subject, setSubject] = useState(email.subject ?? "");
  const [body, setBody] = useState(email.body ?? "");
  const [status, setStatus] = useState<CardStatus>(
    email.status === "sent" ? "sent" : "idle",
  );
  const [errorMsg, setErrorMsg] = useState("");

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
        body: JSON.stringify({ action, to: parseRecipient(to).email || to, cc: cc.trim() || undefined, subject, body }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error ?? "Request failed");
      setStatus(action === "send" ? "sent" : "saved");
    } catch (err: any) {
      setErrorMsg(err?.message ?? "Something went wrong");
      setStatus("error");
    }
  }

  const isSent = status === "sent";
  const isSaved = status === "saved";

  return (
    <div className="mt-3 w-full max-w-[620px] rounded-2xl overflow-hidden border border-border/60 bg-card shadow-sm dark:shadow-[0_4px_24px_rgba(0,0,0,0.22)] animate-in fade-in slide-in-from-bottom-2 duration-200">

      {/* ── Header ── */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 bg-secondary/20 dark:bg-secondary/10">
        <div className="flex items-center gap-2.5">
          <div className="size-7 rounded-lg bg-ai-surface border border-ai/20 flex items-center justify-center shrink-0">
            {isSent ? (
              <CheckCheck className="size-3.5 text-emerald-500" strokeWidth={2} />
            ) : isSaved ? (
              <FileText className="size-3.5 text-sky-500" strokeWidth={1.75} />
            ) : (
              <Pencil className="size-3.5 text-ai" strokeWidth={1.75} />
            )}
          </div>
          <span className="text-[12px] font-semibold text-foreground">
            {isSent ? "Email Sent" : isSaved ? "Saved to Drafts" : "Email Draft"}
          </span>
        </div>

        <span className={`inline-flex items-center gap-1.5 text-[10.5px] font-semibold px-2.5 py-1 rounded-full border leading-none ${
          isSent
            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25"
            : isSaved
            ? "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/25"
            : "bg-ai/8 text-ai border-ai/20"
        }`}>
          <span className={`size-1.5 rounded-full ${
            isSent ? "bg-emerald-500" : isSaved ? "bg-sky-500" : "bg-ai animate-pulse"
          }`} />
          {isSent ? "Delivered" : isSaved ? "In Drafts" : "✨ AI Draft"}
        </span>
      </div>

      {/* ── Fields ── */}
      <div className="divide-y divide-border/40">

        {/* To */}
        <div className="flex items-start gap-3 px-4 py-2.5">
          <span className="text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider w-10 shrink-0 pt-0.5">To</span>
          <div className="flex-1 min-w-0">
            <RecipientChip value={to} onChange={setTo} disabled={busy} locked={locked} />
          </div>
          {!locked && !showCc && (
            <button
              onClick={() => setShowCc(true)}
              className="shrink-0 flex items-center gap-1 text-[10.5px] font-medium text-muted-foreground/50 hover:text-muted-foreground transition-colors cursor-pointer"
            >
              <Plus className="size-3" strokeWidth={2} />
              CC
            </button>
          )}
        </div>

        {/* CC (optional) */}
        {(showCc || cc) && (
          <div className="flex items-start gap-3 px-4 py-2.5">
            <span className="text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider w-10 shrink-0 pt-0.5">CC</span>
            <div className="flex-1 min-w-0">
              {locked ? (
                cc ? <span className="text-[13px] text-foreground">{cc}</span> : null
              ) : (
                <input
                  type="text"
                  value={cc}
                  onChange={(e) => setCc(e.target.value)}
                  disabled={busy}
                  placeholder="cc@example.com, another@example.com"
                  className="w-full text-[13px] text-foreground bg-transparent outline-none placeholder:text-muted-foreground/40 disabled:opacity-50 caret-ai"
                />
              )}
            </div>
            {!locked && (
              <button
                onClick={() => { setShowCc(false); setCc(""); }}
                className="shrink-0 text-muted-foreground/40 hover:text-muted-foreground transition-colors cursor-pointer"
              >
                <X className="size-3.5" strokeWidth={2} />
              </button>
            )}
          </div>
        )}

        {/* Subject */}
        <div className="flex items-start gap-3 px-4 py-2.5">
          <span className="text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider w-10 shrink-0 pt-0.5">Subj</span>
          <div className="flex-1 min-w-0">
            {locked ? (
              <span className="text-[13px] font-medium text-foreground">{subject || "(No subject)"}</span>
            ) : (
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                disabled={busy}
                placeholder="Subject line"
                className="w-full text-[13px] font-medium text-foreground bg-transparent outline-none placeholder:text-muted-foreground/40 disabled:opacity-50 caret-ai"
              />
            )}
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="px-4 py-4">
        {locked ? (
          <div className="text-[13px] leading-relaxed text-foreground/90 whitespace-pre-wrap min-h-[80px]">
            {body || "(Empty body)"}
          </div>
        ) : (
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            disabled={busy}
            placeholder="Write your message here…"
            rows={6}
            className="w-full text-[13px] leading-relaxed text-foreground bg-transparent outline-none resize-none placeholder:text-muted-foreground/40 disabled:opacity-50 min-h-[120px] caret-ai"
          />
        )}
      </div>

      {/* ── Error ── */}
      {status === "error" && (
        <div className="mx-4 mb-3 flex items-center gap-2 text-[12px] text-rose-600 dark:text-rose-400 bg-rose-500/8 border border-rose-500/20 rounded-xl px-3.5 py-2.5">
          <AlertCircle className="size-3.5 shrink-0" strokeWidth={1.75} />
          <span>{errorMsg || "Failed to process. Please try again."}</span>
        </div>
      )}

      {/* ── Footer ── */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-border/40 bg-secondary/10 dark:bg-secondary/5">
        <div className="text-[11px] text-muted-foreground/50">
          {isSent && "Delivered successfully"}
          {isSaved && "Saved to Gmail Drafts"}
          {!locked && "Review and edit before sending"}
        </div>

        {!locked && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => submit("draft")}
              disabled={busy || !to.trim()}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-[12px] font-medium rounded-xl text-muted-foreground hover:text-foreground border border-border/60 hover:border-border hover:bg-secondary/60 disabled:opacity-40 transition-all cursor-pointer"
            >
              {status === "saving" ? (
                <Loader2 className="size-3.5 animate-spin" strokeWidth={1.75} />
              ) : (
                <FileText className="size-3.5" strokeWidth={1.75} />
              )}
              {status === "saving" ? "Saving…" : "Save Draft"}
            </button>

            <button
              onClick={() => submit("send")}
              disabled={busy || !to.trim()}
              className="flex items-center gap-1.5 px-4 py-1.5 text-[12px] font-semibold rounded-xl bg-foreground hover:bg-foreground/90 text-background disabled:opacity-40 shadow-sm transition-all cursor-pointer"
            >
              {status === "sending" ? (
                <Loader2 className="size-3.5 animate-spin" strokeWidth={1.75} />
              ) : (
                <Send className="size-3.5" strokeWidth={1.75} />
              )}
              {status === "sending" ? "Sending…" : "Send"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

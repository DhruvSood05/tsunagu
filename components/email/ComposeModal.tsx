"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Paperclip,
  X,
  FileText,
  Send,
  Minus,
} from "lucide-react";

interface ComposeModalProps {
  onClose: () => void;
  initialTo?: string;
  initialSubject?: string;
}

const MODAL_W   = 480;
const MODAL_H   = 480; // approximate full height for clamping

export default function ComposeModal({ onClose, initialTo = "", initialSubject = "" }: ComposeModalProps) {
  const [to,       setTo]       = useState(initialTo);
  const [subject,  setSubject]  = useState(initialSubject);
  const [body,     setBody]     = useState("");
  const [files,    setFiles]    = useState<FileList | null>(null);
  const [sending,  setSending]  = useState(false);
  const [status,   setStatus]   = useState<string | null>(null);
  const [draftId,  setDraftId]  = useState<string | null>(null);
  const [minimized, setMinimized] = useState(false);

  // Start at bottom-right, like Gmail
  const [pos, setPos] = useState(() => ({
    x: typeof window !== "undefined" ? Math.max(0, window.innerWidth  - MODAL_W   - 24) : 200,
    y: typeof window !== "undefined" ? Math.max(0, window.innerHeight - MODAL_H   - 24) : 200,
  }));

  // Remember position before minimizing so we can restore it
  const prevPos = useRef<{ x: number; y: number } | null>(null);

  const HEADER_H = 44;

  const toggleMinimize = () => {
    setMinimized((m) => {
      if (!m) {
        // Minimizing: save current position, snap to bottom-right
        prevPos.current = pos;
        setPos({
          x: typeof window !== "undefined" ? window.innerWidth  - MODAL_W - 24 : pos.x,
          y: typeof window !== "undefined" ? window.innerHeight - HEADER_H     : pos.y,
        });
      } else {
        // Restoring: go back to where it was before minimizing
        if (prevPos.current) setPos(prevPos.current);
      }
      return !m;
    });
  };

  const [isDragging, setIsDragging] = useState(false);
  const drag = useRef({ active: false, startMX: 0, startMY: 0, startPX: 0, startPY: 0 });

  const onHeaderDown = (e: React.MouseEvent<HTMLDivElement>) => {
    // Don't initiate drag when clicking a button or when minimized (snapped to dock)
    if ((e.target as HTMLElement).closest("button")) return;
    if (minimized) return;
    e.preventDefault();

    drag.current = {
      active: true,
      startMX: e.clientX,
      startMY: e.clientY,
      startPX: pos.x,
      startPY: pos.y,
    };
    setIsDragging(true);
    document.body.style.userSelect = "none";
    document.body.style.cursor     = "grabbing";

    const onMove = (ev: MouseEvent) => {
      if (!drag.current.active) return;
      const nx = drag.current.startPX + ev.clientX - drag.current.startMX;
      const ny = drag.current.startPY + ev.clientY - drag.current.startMY;
      setPos({
        x: Math.max(0, Math.min(nx, window.innerWidth  - MODAL_W)),
        y: Math.max(0, Math.min(ny, window.innerHeight - 44)),
      });
    };

    const onUp = () => {
      drag.current.active            = false;
      setIsDragging(false);
      document.body.style.userSelect = "";
      document.body.style.cursor     = "";
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup",   onUp);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup",   onUp);
  };

  // ── API helpers ────────────────────────────────────────────────────────────

  const buildForm = () => {
    const fd = new FormData();
    fd.set("to", to);
    fd.set("subject", subject);
    fd.set("body", body);
    if (files) Array.from(files).forEach((f) => fd.append("attachments", f));
    return fd;
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setStatus(null);
    try {
      const res = await fetch("/api/compose", { method: "POST", body: buildForm() });
      if (res.ok) {
        setStatus("sent");
        setTimeout(onClose, 900);
      } else {
        const d = await res.json();
        setStatus(d.error ?? "Failed to send");
      }
    } finally {
      setSending(false);
    }
  };

  const handleSaveDraft = async () => {
    const fd = buildForm();
    if (draftId) {
      await fetch(`/api/drafts/${draftId}`, { method: "PATCH", body: fd });
    } else {
      const res  = await fetch("/api/drafts", { method: "POST", body: fd });
      const data = await res.json();
      setDraftId(data.draft?.id ?? null);
    }
    setStatus("draft");
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div
      className="fixed z-50 flex flex-col bg-card border border-border/80 shadow-2xl overflow-hidden rounded-xl font-sans"
      style={{
        left: pos.x,
        top: pos.y,
        width: MODAL_W,
        transition: isDragging
          ? "none"
          : "left 280ms cubic-bezier(0.4,0,0.2,1), top 280ms cubic-bezier(0.4,0,0.2,1)",
      }}
    >
      {/* ── Drag handle / header ─────────────────────────────────────────── */}
      <div
        onMouseDown={onHeaderDown}
        className={`flex items-center justify-between px-4.5 py-3 bg-secondary/85 shrink-0 select-none ${minimized ? "cursor-default" : "cursor-grab active:cursor-grabbing"}`}
      >
        <span className="text-[13px] font-semibold text-foreground truncate pr-2 font-heading">
          {subject.trim() ? subject : "New Message"}
        </span>

        <div className="flex items-center gap-1 shrink-0">
          {/* Minimize / restore */}
          <Button
            variant="ghost"
            size="icon-xs"
            type="button"
            title={minimized ? "Restore" : "Minimize"}
            onClick={toggleMinimize}
            className="text-muted-foreground hover:text-foreground hover:bg-secondary size-6 rounded-lg cursor-pointer"
          >
            <Minus className="size-3.5" strokeWidth={1.75} />
          </Button>
          {/* Close */}
          <Button
            variant="ghost"
            size="icon-xs"
            type="button"
            title="Discard"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground hover:bg-secondary size-6 rounded-lg cursor-pointer"
          >
            <X className="size-4" strokeWidth={1.75} />
          </Button>
        </div>
      </div>

      {/* ── Compose form — always mounted, animated via max-height + opacity */}
      <div
        style={{
          maxHeight: minimized ? 0 : 600,
          opacity: minimized ? 0 : 1,
          pointerEvents: minimized ? "none" : "auto",
          transition: minimized
            ? "max-height 260ms cubic-bezier(0.4,0,0.2,1), opacity 180ms ease"
            : "max-height 300ms cubic-bezier(0.4,0,0.2,1), opacity 220ms ease 60ms",
          overflow: "hidden",
        }}
      >
        <form onSubmit={handleSend} className="flex flex-col bg-card" style={{ minHeight: MODAL_H - HEADER_H }}>
          {/* To / Subject fields */}
          <div className="px-4.5 pt-3 pb-1 space-y-2.5 shrink-0">
            <div className="flex items-center gap-3 border-b border-border/40 pb-2">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider w-10 shrink-0 font-heading">
                To
              </span>
              <Input
                value={to}
                onChange={(e) => setTo(e.target.value)}
                placeholder="recipient@example.com"
                type="email"
                autoFocus={!initialTo}
                className="h-8 text-[13px] border-0 rounded-none px-0 shadow-none focus-visible:ring-0 bg-transparent"
              />
            </div>

            <div className="flex items-center gap-3 border-b border-border/40 pb-2">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider w-10 shrink-0 font-heading">
                Subj
              </span>
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Subject"
                autoFocus={!!initialTo}
                className="h-8 text-[13px] border-0 rounded-none px-0 shadow-none focus-visible:ring-0 bg-transparent"
              />
            </div>
          </div>

          {/* Message body */}
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write your message…"
            className="flex-1 px-5 py-4 text-[13px] text-foreground resize-none outline-none bg-transparent placeholder:text-muted-foreground/45 leading-relaxed"
            style={{ minHeight: 240 }}
          />

          <Separator className="border-border/40" />

          {/* Footer toolbar */}
          <div className="px-4.5 py-3.5 flex items-center justify-between gap-2 shrink-0 bg-secondary/15">
            {/* Attach */}
            <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors select-none">
              <Paperclip className="size-4" strokeWidth={1.75} />
              <input
                type="file"
                multiple
                onChange={(e) => setFiles(e.target.files)}
                className="hidden"
              />
              <span className="text-[11px] font-medium">
                {files && files.length > 0 ? `${files.length} attached` : "Attach files"}
              </span>
            </label>

            {/* Status + actions */}
            <div className="flex items-center gap-2">
              {status === "sent" && (
                <span className="text-xs text-emerald-500 font-semibold mr-1 animate-pulse">Sent!</span>
              )}
              {status === "draft" && (
                <span className="text-xs text-muted-foreground mr-1">Draft saved</span>
              )}
              {status && status !== "sent" && status !== "draft" && (
                <span className="text-xs text-rose-500 font-semibold mr-1">{status}</span>
              )}

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleSaveDraft}
                className="h-9 px-3.5 gap-1.5 text-[13px] font-semibold rounded-lg cursor-pointer border border-border/60 hover:border-border transition-all"
              >
                <FileText className="size-3.5" strokeWidth={1.75} />
                Save Draft
              </Button>

              <Button
                type="submit"
                size="sm"
                disabled={sending || !to.trim() || !subject.trim() || !body.trim()}
                className="h-9 px-4.5 gap-1.5 text-[13px] font-semibold rounded-lg cursor-pointer bg-foreground text-background hover:bg-foreground/90 shadow-sm"
              >
                <Send className="size-3.5" strokeWidth={1.75} />
                {sending ? "Sending…" : "Send"}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

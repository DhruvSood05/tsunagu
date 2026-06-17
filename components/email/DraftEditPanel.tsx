"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { RiArrowLeftLine, RiSendPlaneLine, RiAttachmentLine } from "@remixicon/react";

interface DraftEditPanelProps {
  draftId: string;
  initialTo: string;
  initialSubject: string;
  initialBody: string;
  onClose: () => void;
  onSent: () => void;
}

type SaveStatus = "idle" | "unsaved" | "saving" | "saved" | "error";

const saveLabel: Record<SaveStatus, string> = {
  idle: "",
  unsaved: "Unsaved",
  saving: "Saving…",
  saved: "Saved",
  error: "Failed to save",
};

export default function DraftEditPanel({
  draftId, initialTo, initialSubject, initialBody, onClose, onSent,
}: DraftEditPanelProps) {
  const [to, setTo] = useState(initialTo);
  const [subject, setSubject] = useState(initialSubject);
  const [body, setBody] = useState(initialBody);
  const [files, setFiles] = useState<FileList | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [sending, setSending] = useState(false);

  const lastSaved = useRef({ to: initialTo, subject: initialSubject, body: initialBody });

  useEffect(() => {
    const hasChanged =
      to !== lastSaved.current.to ||
      subject !== lastSaved.current.subject ||
      body !== lastSaved.current.body;
    if (!hasChanged) return;

    setSaveStatus("unsaved");
    const timer = setTimeout(async () => {
      setSaveStatus("saving");
      const fd = new FormData();
      fd.set("to", to); fd.set("subject", subject); fd.set("body", body);
      if (files) Array.from(files).forEach((f) => fd.append("attachments", f));
      const res = await fetch(`/api/drafts/${draftId}`, { method: "PATCH", body: fd });
      if (res.ok) {
        lastSaved.current = { to, subject, body };
        setSaveStatus("saved");
      } else {
        setSaveStatus("error");
      }
    }, 1500);
    return () => clearTimeout(timer);
  }, [to, subject, body, draftId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSend = async () => {
    setSending(true);
    const res = await fetch(`/api/drafts/${draftId}/send`, { method: "POST" });
    if (res.ok) onSent();
    else setSending(false);
  };

  const avatarLetter = (to?.[0] ?? "M").toUpperCase();

  return (
    <div className="flex flex-col h-full overflow-hidden bg-card font-sans select-none">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-border/40 shrink-0 bg-card/60 backdrop-blur-sm">
        <Button variant="ghost" size="icon-sm" onClick={onClose} title="Close" className="rounded-lg hover:bg-secondary cursor-pointer">
          <RiArrowLeftLine className="size-4 text-muted-foreground hover:text-foreground" />
        </Button>
        <div className="flex items-center gap-2.5">
          {saveLabel[saveStatus] && (
            <span className={`text-[10px] font-semibold ${
              saveStatus === "saved" ? "text-emerald-500"
              : saveStatus === "error" ? "text-rose-500"
              : "text-muted-foreground/60"
            }`}>
              {saveLabel[saveStatus]}
            </span>
          )}
          <Button onClick={handleSend} disabled={sending} className="gap-2 h-9 px-4.5 rounded-lg font-semibold text-xs cursor-pointer shadow-sm">
            <RiSendPlaneLine className="size-3.5" />
            {sending ? "Sending…" : "Send"}
          </Button>
        </div>
      </div>

      {/* Header */}
      <div className="px-6 pt-5 pb-4 border-b border-border/25 shrink-0 bg-card/20">
        <input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Subject"
          className="w-full text-xl font-semibold text-foreground outline-none mb-4 bg-transparent placeholder:text-muted-foreground/45 tracking-tight"
        />
        <div className="flex items-start gap-3">
          <Avatar className="size-9 border border-border/40">
            <AvatarFallback className="text-xs bg-secondary/80 font-bold">{avatarLetter}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-foreground">Me</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[10px] text-muted-foreground/60 shrink-0 font-heading">To:</span>
              <input
                value={to}
                onChange={(e) => setTo(e.target.value)}
                placeholder="recipient@example.com"
                className="text-xs text-foreground outline-none flex-1 min-w-0 bg-transparent placeholder:text-muted-foreground/45"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-6 py-5 bg-card/10">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Write your message…"
          className="w-full h-full min-h-48 text-xs text-foreground resize-none outline-none leading-relaxed bg-transparent placeholder:text-muted-foreground/45"
        />
      </div>

      <Separator className="border-border/40" />

      {/* Attachments */}
      <div className="px-5 py-3.5 shrink-0 bg-secondary/15">
        <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors w-fit select-none">
          <RiAttachmentLine className="size-4" />
          <input type="file" multiple onChange={(e) => setFiles(e.target.files)} className="hidden" />
          <span className="text-[11px] font-medium">
            {files && files.length > 0 ? `${files.length} file(s) attached` : "Attach files"}
          </span>
        </label>
      </div>
    </div>
  );
}

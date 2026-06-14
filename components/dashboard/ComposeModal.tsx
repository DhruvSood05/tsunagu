"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { RiCloseLine, RiAttachmentLine, RiSendPlaneLine, RiDraftLine } from "@remixicon/react";

interface ComposeModalProps {
  onClose: () => void;
}

export default function ComposeModal({ onClose }: ComposeModalProps) {
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [files, setFiles] = useState<FileList | null>(null);
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [draftId, setDraftId] = useState<string | null>(null);

  const buildForm = () => {
    const fd = new FormData();
    fd.set("to", to); fd.set("subject", subject); fd.set("body", body);
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
        setTimeout(onClose, 800);
      } else {
        const d = await res.json();
        setStatus(d.error ?? "error");
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
      const res = await fetch("/api/drafts", { method: "POST", body: fd });
      const data = await res.json();
      setDraftId(data.draft?.id ?? null);
    }
    setStatus("draft");
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end justify-end p-4 z-50">
      <div className="bg-background border border-border shadow-xl w-full max-w-md flex flex-col" style={{ minHeight: 460 }}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-primary shrink-0">
          <h3 className="text-xs font-medium text-primary-foreground">New Message</h3>
          <Button variant="ghost" size="icon-sm" onClick={onClose} className="text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary/80">
            <RiCloseLine />
          </Button>
        </div>

        <form onSubmit={handleSend} className="flex flex-col flex-1">
          {/* Fields */}
          <div className="px-4 pt-3 pb-1 space-y-3 shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-muted-foreground w-12 shrink-0">To</span>
              <Input
                value={to}
                onChange={(e) => setTo(e.target.value)}
                placeholder="recipient@example.com"
                className="h-7 text-xs border-0 border-b rounded-none px-0 focus-visible:ring-0 focus-visible:border-primary bg-transparent"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-muted-foreground w-12 shrink-0">Subject</span>
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Subject"
                className="h-7 text-xs border-0 border-b rounded-none px-0 focus-visible:ring-0 focus-visible:border-primary bg-transparent"
              />
            </div>
          </div>

          <Separator className="mt-3" />

          {/* Body */}
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write your message…"
            className="flex-1 px-4 py-3 text-sm text-foreground resize-none outline-none bg-transparent min-h-40 placeholder:text-muted-foreground/60"
          />

          <Separator />

          {/* Footer */}
          <div className="px-4 py-2.5 flex items-center justify-between gap-2 shrink-0">
            <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
              <RiAttachmentLine className="size-3.5" />
              <input type="file" multiple onChange={(e) => setFiles(e.target.files)} className="hidden" />
              {files && files.length > 0 ? `${files.length} file(s)` : "Attach"}
            </label>

            <div className="flex items-center gap-2">
              {status === "sent" && <span className="text-xs text-green-600">Sent!</span>}
              {status === "draft" && <span className="text-xs text-muted-foreground">Draft saved</span>}
              {status && status !== "sent" && status !== "draft" && (
                <span className="text-xs text-destructive">{status}</span>
              )}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleSaveDraft}
                className="gap-1.5"
              >
                <RiDraftLine className="size-3.5" />
                Save Draft
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={sending || !to || !subject || !body}
                className="gap-1.5"
              >
                <RiSendPlaneLine className="size-3.5" />
                {sending ? "Sending…" : "Send"}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

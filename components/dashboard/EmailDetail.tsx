"use client";
import { useState } from "react";
import { getHeader, decodeEmailBody } from "@/lib/email";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  RiArrowLeftLine,
  RiReplyLine,
  RiDeleteBinLine,
  RiAttachmentLine,
  RiSendPlaneLine,
} from "@remixicon/react";

interface EmailDetailProps {
  email: any;
  onClose: () => void;
  onDelete: () => void;
}

const EMAIL_STYLES = `
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
      font-size: 14px;
      line-height: 1.6;
      color: #1f2937;
      margin: 0;
      padding: 16px 20px;
      word-break: break-word;
    }
    a { color: #2563eb; }
    img { max-width: 100%; height: auto; }
    blockquote { border-left: 3px solid #d1d5db; margin: 8px 0; padding: 4px 12px; color: #6b7280; }
    pre, code { font-size: 13px; background: #f3f4f6; border-radius: 4px; padding: 2px 4px; }
    table { border-collapse: collapse; width: 100%; }
    td, th { padding: 6px 8px; }
  </style>
`;

function SenderAvatar({ url, initials }: { url?: string; initials: string }) {
  const [imgError, setImgError] = useState(false);
  if (url && !imgError) {
    return (
      <img
        src={url}
        alt={initials}
        referrerPolicy="no-referrer"
        onError={() => setImgError(true)}
        className="size-8 rounded-full object-cover shrink-0"
      />
    );
  }
  return (
    <div className="size-8 rounded-full bg-muted flex items-center justify-center shrink-0">
      <span className="text-xs font-semibold text-muted-foreground leading-none">{initials}</span>
    </div>
  );
}

export default function EmailDetail({ email, onClose, onDelete }: EmailDetailProps) {
  const [showReply, setShowReply] = useState(false);
  const [replyTo, setReplyTo] = useState(getHeader(email, "From"));
  const [replyBody, setReplyBody] = useState("");
  const [files, setFiles] = useState<FileList | null>(null);
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const subject = getHeader(email, "Subject");
  const from = getHeader(email, "From");
  const to = getHeader(email, "To");
  const date = getHeader(email, "Date");
  const { content, isHtml } = decodeEmailBody(email);

  const senderName = from.replace(/<[^>]*>/g, "").trim();
  const senderEmail = from.match(/<([^>]+)>/)?.[1] ?? from;
  const initials = senderName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2) || senderEmail[0]?.toUpperCase() || "?";

  const dateObj = email.internalDate
    ? new Date(Number(email.internalDate))
    : date ? new Date(date) : null;
  const formattedDate = dateObj && !isNaN(dateObj.getTime())
    ? dateObj.toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })
    : "";

  const handleDelete = async () => {
    setDeleting(true);
    await fetch(`/api/emails/${email.id}`, { method: "DELETE" });
    onDelete();
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setStatus(null);
    const fd = new FormData();
    fd.set("to", replyTo);
    fd.set("body", replyBody);
    if (files) Array.from(files).forEach((f) => fd.append("attachments", f));
    try {
      const res = await fetch(`/api/emails/${email.id}/reply`, { method: "POST", body: fd });
      if (res.ok) {
        setStatus("sent");
        setReplyBody("");
        setFiles(null);
        setShowReply(false);
      } else {
        setStatus("error");
      }
    } finally {
      setSending(false);
    }
  };

  const srcDoc = isHtml
    ? `<!DOCTYPE html><html><head><meta charset="utf-8">${EMAIL_STYLES}</head><body>${content}</body></html>`
    : undefined;

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b shrink-0">
        <Button variant="ghost" size="icon-sm" onClick={onClose} title="Back">
          <RiArrowLeftLine />
        </Button>
        <div className="flex items-center gap-1.5">
          <Button
            variant={showReply ? "secondary" : "outline"}
            size="sm"
            onClick={() => setShowReply(!showReply)}
            className="gap-1.5"
          >
            <RiReplyLine className="size-3.5" />
            Reply
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={deleting}
            className="gap-1.5"
          >
            <RiDeleteBinLine className="size-3.5" />
            {deleting ? "Deleting…" : "Trash"}
          </Button>
        </div>
      </div>

      {/* Email header */}
      <div className="px-6 pt-5 pb-4 border-b shrink-0">
        <h2 className="text-base font-semibold text-foreground leading-snug mb-4">
          {subject || "(no subject)"}
        </h2>
        <div className="flex items-start gap-3">
          <SenderAvatar url={email._gravatarUrl} initials={initials} />
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline justify-between gap-2">
              <p className="text-xs font-semibold text-foreground truncate">
                {senderName || senderEmail}
              </p>
              <p className="text-[10px] text-muted-foreground shrink-0">{formattedDate}</p>
            </div>
            {senderName && (
              <p className="text-[10px] text-muted-foreground mt-0.5">{senderEmail}</p>
            )}
            <p className="text-[10px] text-muted-foreground mt-0.5">To: {to}</p>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-hidden">
        {isHtml ? (
          <iframe
            srcDoc={srcDoc}
            sandbox="allow-same-origin allow-popups"
            className="w-full h-full border-0"
            title="Email content"
          />
        ) : (
          <div className="h-full overflow-y-auto px-6 py-5 text-sm text-foreground whitespace-pre-wrap leading-relaxed">
            {content || "(empty)"}
          </div>
        )}
      </div>

      {/* Reply form */}
      {showReply && (
        <>
          <Separator />
          <form onSubmit={handleReply} className="bg-background shrink-0 flex flex-col">
            <div className="px-4 pt-3 pb-2">
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest mb-2">
                Reply
              </p>
              <input
                value={replyTo}
                onChange={(e) => setReplyTo(e.target.value)}
                className="w-full text-xs text-foreground outline-none bg-transparent border-b border-border pb-2 mb-2"
                placeholder="To"
              />
            </div>
            <textarea
              value={replyBody}
              onChange={(e) => setReplyBody(e.target.value)}
              placeholder="Write your reply…"
              rows={4}
              className="px-4 py-2 text-sm text-foreground resize-none outline-none bg-transparent"
            />
            <div className="px-4 py-3 border-t flex items-center justify-between gap-3">
              <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
                <RiAttachmentLine className="size-3.5" />
                <input type="file" multiple onChange={(e) => setFiles(e.target.files)} className="hidden" />
                {files && files.length > 0 ? `${files.length} file(s)` : "Attach"}
              </label>
              <div className="flex items-center gap-2">
                {status === "error" && (
                  <span className="text-xs text-destructive">Failed to send.</span>
                )}
                <Button
                  type="submit"
                  size="sm"
                  disabled={sending || !replyBody.trim()}
                  className="gap-1.5"
                >
                  <RiSendPlaneLine className="size-3.5" />
                  {sending ? "Sending…" : "Send"}
                </Button>
              </div>
            </div>
          </form>
        </>
      )}
    </div>
  );
}

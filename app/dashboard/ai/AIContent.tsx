"use client";

import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import Sidebar from "@/components/dashboard/Sidebar";
import { Button } from "@/components/ui/button";
import {
  RiSendPlaneLine,
  RiSparkling2Line,
  RiCalendarEventLine,
  RiMailLine,
} from "@remixicon/react";

interface Message {
  role: "user" | "assistant";
  content: string;
  toolsUsed?: string[];
}

// Module-level — survives page navigation within the session
let _cachedMessages: Message[] = [];

interface AIContentProps {
  user: { name?: string | null; email?: string | null; image?: string | null } | null;
  gmailConnected: boolean;
  calendarConnected: boolean;
}

const TOOL_LABELS: Record<string, string> = {
  list_operations: "Discovering available tools…",
  get_schema: "Reading API schema…",
  run_script: "Calling API…",
  send_email: "Sending email…",
  corsair_setup: "Setting up…",
};

const SUGGESTIONS = [
  "Give me a brief summary of what's important in my inbox today. Highlight urgent items, action items, and key senders.",
  "Do I have any meetings this week?",
  "Summarize my unread emails",
  "Draft an email to follow up on my latest thread",
];

const SUGGESTION_LABELS = [
  "Summarize my inbox",
  "Do I have any meetings this week?",
  "Summarize my unread emails",
  "Draft a follow-up email",
];

export default function AIContent({ user, gmailConnected, calendarConnected }: AIContentProps) {
  const [messages, setMessages] = useState<Message[]>(_cachedMessages);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [activeTools, setActiveTools] = useState<string[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Auto-scroll to bottom when messages update
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, activeTools]);

  const updateMessages = (updater: (prev: Message[]) => Message[]) => {
    setMessages((prev) => {
      const next = updater(prev);
      _cachedMessages = next;
      return next;
    });
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || streaming) return;

    const userMsg: Message = { role: "user", content: text };
    const newMessages = [...messages, userMsg];
    _cachedMessages = newMessages;
    setMessages(newMessages);
    setInput("");
    setStreaming(true);
    setActiveTools([]);

    // Placeholder for streaming assistant response
    const assistantPlaceholder: Message = { role: "assistant", content: "" };
    updateMessages((prev) => [...prev, assistantPlaceholder]);

    const openaiMessages = newMessages.map((m) => ({ role: m.role, content: m.content }));

    abortRef.current = new AbortController();

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: openaiMessages }),
        signal: abortRef.current.signal,
      });

      if (!res.ok || !res.body) throw new Error("Request failed");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let fullText = "";
      const usedTools: string[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const raw = line.slice(6).trim();
          if (raw === "[DONE]") break;

          try {
            const event = JSON.parse(raw);
            if (event.text) {
              fullText += event.text;
              updateMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = { role: "assistant", content: fullText, toolsUsed: usedTools };
                return updated;
              });
            }
            if (event.tool) {
              if (!usedTools.includes(event.tool)) usedTools.push(event.tool);
              setActiveTools([...usedTools]);
            }
            if (event.done) {
              setActiveTools([]);
            }
            if (event.error) {
              fullText = "Sorry, something went wrong. Please try again.";
              updateMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = { role: "assistant", content: fullText };
                return updated;
              });
            }
          } catch {}
        }
      }

      updateMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: "assistant", content: fullText || "Done.", toolsUsed: usedTools };
        return updated;
      });
    } catch (err: any) {
      if (err?.name === "AbortError") return;
      updateMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: "assistant", content: "Sorry, I couldn't connect. Please try again." };
        return updated;
      });
    } finally {
      setStreaming(false);
      setActiveTools([]);
      abortRef.current = null;
      inputRef.current?.focus();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const isEmpty = messages.length === 0;

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar user={user} gmailConnected={gmailConnected} calendarConnected={calendarConnected} />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b shrink-0 flex items-center gap-2.5">
          <RiSparkling2Line className="size-4 text-primary" />
          <h1 className="text-sm font-semibold text-foreground">Tsunagu AI</h1>
          <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">Beta</span>
        </div>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {isEmpty ? (
            <div className="flex flex-col items-center justify-center h-full gap-6 pb-20">
              <div className="flex flex-col items-center gap-3">
                <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <RiSparkling2Line className="size-6 text-primary" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-foreground">How can I help you?</p>
                  <p className="text-xs text-muted-foreground mt-1">Ask me about your emails, calendar, or get help drafting</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 w-full max-w-lg">
                {SUGGESTION_LABELS.map((label, i) => (
                  <button
                    key={label}
                    onClick={() => sendMessage(SUGGESTIONS[i])}
                    className="text-left px-3 py-2.5 text-xs text-muted-foreground bg-muted/50 hover:bg-muted border border-border rounded-lg transition-colors"
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-4">
              {messages.map((msg, i) => (
                <div key={i} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  {msg.role === "assistant" && (
                    <div className="size-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                      <RiSparkling2Line className="size-3.5 text-primary" />
                    </div>
                  )}
                  <div className={`max-w-[75%] ${msg.role === "user" ? "order-first" : ""}`}>
                    {msg.toolsUsed && msg.toolsUsed.length > 0 && msg.role === "assistant" && (
                      <div className="flex flex-wrap gap-1 mb-1.5">
                        {msg.toolsUsed.map((t) => (
                          <span key={t} className="inline-flex items-center gap-1 text-[9px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
                            <ToolIcon name={t} />
                            {t.replace(/_/g, " ")}
                          </span>
                        ))}
                      </div>
                    )}
                    <div
                      className={`px-3.5 py-2.5 rounded-xl text-sm leading-relaxed ${
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground rounded-br-sm whitespace-pre-wrap"
                          : "bg-muted text-foreground rounded-bl-sm"
                      } ${msg.role === "assistant" && !msg.content ? "min-w-16" : ""}`}
                    >
                      {msg.role === "assistant" && !msg.content ? (
                        <TypingIndicator />
                      ) : msg.role === "assistant" ? (
                        <MarkdownMessage content={msg.content} />
                      ) : (
                        msg.content
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* Active tool indicator */}
              {streaming && activeTools.length > 0 && (
                <div className="flex gap-3 justify-start">
                  <div className="size-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <RiSparkling2Line className="size-3.5 text-primary animate-pulse" />
                  </div>
                  <div className="bg-muted rounded-xl rounded-bl-sm px-3.5 py-2 text-xs text-muted-foreground">
                    {TOOL_LABELS[activeTools[activeTools.length - 1]] ?? "Working…"}
                  </div>
                </div>
              )}

              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {/* Input bar */}
        <div className="px-4 py-3 border-t shrink-0">
          <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
            <div className="flex items-end gap-2 bg-muted/50 border border-border rounded-xl px-3 py-2 focus-within:border-primary/50 transition-colors">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about your emails or calendar…"
                rows={1}
                disabled={streaming}
                className="flex-1 text-sm text-foreground bg-transparent outline-none resize-none placeholder:text-muted-foreground leading-relaxed max-h-36 overflow-y-auto disabled:opacity-50"
                style={{ fieldSizing: "content" } as any}
              />
              <Button
                type="submit"
                size="icon-sm"
                disabled={!input.trim() || streaming}
                className="shrink-0 mb-0.5"
              >
                <RiSendPlaneLine className="size-3.5" />
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground text-center mt-1.5">
              Enter to send · Shift+Enter for new line
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

function MarkdownMessage({ content }: { content: string }) {
  return (
    <ReactMarkdown
      components={{
        p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
        strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
        em: ({ children }) => <em className="italic">{children}</em>,
        ul: ({ children }) => <ul className="mb-2 last:mb-0 pl-4 space-y-0.5 list-disc">{children}</ul>,
        ol: ({ children }) => <ol className="mb-2 last:mb-0 pl-4 space-y-0.5 list-decimal">{children}</ol>,
        li: ({ children }) => <li className="leading-relaxed">{children}</li>,
        h1: ({ children }) => <h1 className="text-base font-semibold mb-1.5 mt-2 first:mt-0">{children}</h1>,
        h2: ({ children }) => <h2 className="text-sm font-semibold mb-1.5 mt-2 first:mt-0">{children}</h2>,
        h3: ({ children }) => <h3 className="text-sm font-medium mb-1 mt-2 first:mt-0">{children}</h3>,
        code: ({ children, className }) => {
          const isBlock = className?.includes("language-");
          if (isBlock) {
            return (
              <pre className="bg-background/60 border border-border/40 rounded-lg px-3 py-2 text-xs overflow-x-auto my-2 font-mono">
                <code>{children}</code>
              </pre>
            );
          }
          return <code className="bg-background/60 border border-border/30 rounded px-1 py-0.5 text-xs font-mono">{children}</code>;
        },
        pre: ({ children }) => <>{children}</>,
        a: ({ href, children }) => (
          <a href={href} target="_blank" rel="noreferrer" className="text-primary underline underline-offset-2 hover:opacity-75">
            {children}
          </a>
        ),
        blockquote: ({ children }) => (
          <blockquote className="border-l-2 border-border pl-3 text-muted-foreground my-2">{children}</blockquote>
        ),
        hr: () => <hr className="border-border/40 my-3" />,
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

function TypingIndicator() {
  return (
    <span className="flex gap-1 items-center h-4">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="size-1.5 rounded-full bg-muted-foreground/50 animate-bounce"
          style={{ animationDelay: `${i * 150}ms`, animationDuration: "800ms" }}
        />
      ))}
    </span>
  );
}

function ToolIcon({ name }: { name: string }) {
  if (name === "send_email") return <RiSendPlaneLine className="size-2.5" />;
  if (name === "run_script") return <RiSparkling2Line className="size-2.5" />;
  return <RiMailLine className="size-2.5" />;
}

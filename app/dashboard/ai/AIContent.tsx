"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Sidebar from "@/components/layout/Sidebar";
import TopNav from "@/components/layout/TopNav";
import SettingsOverlay from "@/components/layout/SettingsOverlay";
import AIChatBubble from "@/components/ai/AIChatBubble";
import { Button } from "@/components/ui/button";
import {
  Send,
  Sparkles,
  Plus,
  Trash2,
  History,
  PanelLeftClose,
  PanelLeft,
  MessageSquare,
} from "lucide-react";
import type { Message, ChatArtifact } from "@/types/ai";

interface ChatSession {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

interface AIContentProps {
  user: { name?: string | null; email?: string | null; image?: string | null } | null;
  gmailConnected: boolean;
  calendarConnected: boolean;
}

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
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  // Default closed on mobile — desktop gets it open
  const [sidebarOpen, setSidebarOpen] = useState(false);
  useEffect(() => {
    setSidebarOpen(window.innerWidth >= 768);
  }, []);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Auto-scroll to bottom when messages update
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streaming]);

  // Global keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const ctrl = e.ctrlKey || e.metaKey;
      if (ctrl && e.key === "k") {
        e.preventDefault();
        createNewSession();
      }
      if (ctrl && e.key === "/") {
        e.preventDefault();
        setSidebarOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load sessions on mount
  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    const res = await fetch("/api/ai/sessions");
    if (!res.ok) return;
    const data = await res.json();
    setSessions(data.sessions ?? []);
  };

  const loadSession = useCallback(async (sessionId: string) => {
    setLoadingMessages(true);
    setActiveSessionId(sessionId);
    setMessages([]);
    try {
      const res = await fetch(`/api/ai/sessions/${sessionId}/messages`);
      if (!res.ok) return;
      const data = await res.json();
      const msgs: Message[] = (data.messages ?? []).map((m: any) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
        toolsUsed: m.toolsUsed ?? undefined,
        artifacts: m.artifacts ?? undefined,
      }));
      setMessages(msgs);
    } finally {
      setLoadingMessages(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, []);

  const createNewSession = async () => {
    const res = await fetch("/api/ai/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "New Chat" }),
    });
    if (!res.ok) return;
    const data = await res.json();
    const newSession: ChatSession = data.session;
    setSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
    setMessages([]);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const deleteSession = async (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    await fetch(`/api/ai/sessions/${sessionId}`, { method: "DELETE" });
    setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    if (activeSessionId === sessionId) {
      setActiveSessionId(null);
      setMessages([]);
    }
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || streaming) return;

    // Auto-create session if none selected
    let sessionId = activeSessionId;
    if (!sessionId) {
      const res = await fetch("/api/ai/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "New Chat" }),
      });
      if (!res.ok) return;
      const data = await res.json();
      sessionId = data.session.id;
      setSessions((prev) => [data.session, ...prev]);
      setActiveSessionId(sessionId);
    }

    const userMsg: Message = { role: "user", content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setStreaming(true);

    const assistantPlaceholder: Message = { role: "assistant", content: "" };
    setMessages((prev) => [...prev, assistantPlaceholder]);

    const openaiMessages = newMessages.map((m) => ({ role: m.role, content: m.content }));

    abortRef.current = new AbortController();

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: openaiMessages, sessionId }),
        signal: abortRef.current.signal,
      });

      if (!res.ok || !res.body) throw new Error("Request failed");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let fullText = "";
      const usedTools: string[] = [];
      const artifacts: ChatArtifact[] = [];

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
            if (event.text_reset) {
              // A tool completed and the model is starting a new response turn —
              // discard the pre-tool text so it doesn't get duplicated.
              fullText = "";
              setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = { role: "assistant", content: "", toolsUsed: usedTools, artifacts: [...artifacts] };
                return updated;
              });
            }
            if (event.text) {
              fullText += event.text;
              setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = { role: "assistant", content: fullText, toolsUsed: usedTools, artifacts: [...artifacts] };
                return updated;
              });
            }
            if (event.tool) {
              if (!usedTools.includes(event.tool)) usedTools.push(event.tool);
            }
            if (event.artifact) {
              artifacts.push(event.artifact as ChatArtifact);
              setMessages((prev) => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                updated[updated.length - 1] = { role: "assistant", content: last?.content ?? fullText, toolsUsed: usedTools, artifacts: [...artifacts] };
                return updated;
              });
            }
            if (event.error) {
              fullText = "Sorry, something went wrong. Please try again.";
              setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = { role: "assistant", content: fullText };
                return updated;
              });
            }
          } catch {}
        }
      }

      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: "assistant", content: fullText || "Done.", toolsUsed: usedTools, artifacts: [...artifacts] };
        return updated;
      });

      // Update session title in sidebar list after first message
      if (newMessages.filter((m) => m.role === "user").length === 1 && sessionId) {
        const title = text.slice(0, 60) + (text.length > 60 ? "…" : "");
        setSessions((prev) =>
          prev.map((s) => (s.id === sessionId ? { ...s, title, updatedAt: new Date().toISOString() } : s))
        );
      }
    } catch (err: any) {
      if (err?.name === "AbortError") return;
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: "assistant", content: "Sorry, I couldn't connect. Please try again." };
        return updated;
      });
    } finally {
      setStreaming(false);
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

  function formatSessionDate(iso: string) {
    const d = new Date(iso);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 86400000) return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
    if (diff < 604800000) return d.toLocaleDateString("en-US", { weekday: "short" });
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar user={user} gmailConnected={gmailConnected} calendarConnected={calendarConnected} />

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <TopNav user={user} gmailConnected={gmailConnected} />

        <div className="flex-1 flex overflow-hidden p-2 md:p-4 pt-0 gap-2 md:gap-4">

          {/* Session History Sidebar */}
          {sidebarOpen && (
            <div
              id="tour-ai-sessions"
              className="w-56 shrink-0 bg-card border border-border/40 rounded-2xl overflow-hidden shadow-lg flex flex-col"
            >
              <div className="px-3 py-3 border-b border-border/40 flex items-center justify-between bg-card/60 backdrop-blur-sm shrink-0">
                <div className="flex items-center gap-1.5">
                  <History className="size-3.5 text-muted-foreground" strokeWidth={1.75} />
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">History</span>
                </div>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="size-6 flex items-center justify-center rounded-lg text-muted-foreground/40 hover:text-foreground hover:bg-secondary/60 transition-all cursor-pointer"
                >
                  <PanelLeftClose className="size-3.5" strokeWidth={1.75} />
                </button>
              </div>

              <div className="px-2 py-2 shrink-0">
                <button
                  onClick={createNewSession}
                  className="w-full flex items-center gap-2 px-2.5 py-2 text-xs font-semibold text-foreground bg-secondary/40 hover:bg-secondary/80 border border-border/30 rounded-xl transition-all cursor-pointer"
                >
                  <Plus className="size-3.5 shrink-0" strokeWidth={2} />
                  New Chat
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-0.5">
                {sessions.length === 0 && (
                  <p className="text-[10px] text-muted-foreground/40 text-center py-6 px-2">
                    No conversations yet. Start chatting!
                  </p>
                )}
                {sessions.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => loadSession(s.id)}
                    className={`group w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-left transition-all cursor-pointer ${
                      activeSessionId === s.id
                        ? "bg-secondary text-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary/40"
                    }`}
                  >
                    <MessageSquare className="size-3 shrink-0 opacity-50" strokeWidth={2} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-medium truncate leading-tight">{s.title}</p>
                      <p className="text-[9px] text-muted-foreground/50 mt-0.5 font-mono">
                        {formatSessionDate(s.updatedAt)}
                      </p>
                    </div>
                    <button
                      onClick={(e) => deleteSession(e, s.id)}
                      className="shrink-0 opacity-0 group-hover:opacity-100 size-5 flex items-center justify-center rounded-lg text-muted-foreground/40 hover:text-rose-500 transition-all cursor-pointer"
                    >
                      <Trash2 className="size-3" strokeWidth={1.75} />
                    </button>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Main Chat Area */}
          <div
            id="tour-ai-chat"
            className="flex-1 bg-card border border-border/40 rounded-2xl overflow-hidden shadow-lg flex flex-col relative min-w-0"
          >
            {/* Inner Header */}
            <div className="px-5 py-3.5 border-b border-border/40 shrink-0 flex items-center justify-between bg-card/70 backdrop-blur-sm relative z-10">
              <div className="flex items-center gap-2.5">
                {!sidebarOpen && (
                  <button
                    onClick={() => setSidebarOpen(true)}
                    className="size-7 flex items-center justify-center rounded-xl text-muted-foreground/40 hover:text-foreground hover:bg-secondary/60 transition-all cursor-pointer"
                  >
                    <PanelLeft className="size-3.5" strokeWidth={1.75} />
                  </button>
                )}
                <div className="size-7 rounded-full bg-ai-surface border border-ai/15 flex items-center justify-center">
                  <Sparkles className="size-3.5 text-ai" strokeWidth={1.75} />
                </div>
                <h1 className="text-[13px] font-bold text-foreground tracking-wide">AI Assistant</h1>
              </div>
              <button
                onClick={createNewSession}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-semibold text-muted-foreground hover:text-foreground bg-secondary/40 hover:bg-secondary/80 border border-border/30 rounded-xl transition-all cursor-pointer"
              >
                <Plus className="size-3" strokeWidth={2} />
                New Chat
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
              {loadingMessages ? (
               <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground/40">
                  <History className="size-7 animate-pulse" strokeWidth={1.5} />
                  <p className="text-xs">Loading conversation…</p>
                </div>
              ) : isEmpty ? (
                <div className="flex flex-col items-center justify-center h-full gap-8 max-w-2xl mx-auto text-center py-10">
                  <div className="flex flex-col items-center gap-4">
                    <div className="size-14 rounded-full bg-ai-surface border border-ai/20 flex items-center justify-center shadow-md">
                      <Sparkles className="size-6 text-ai" strokeWidth={1.75} />
                    </div>
                    <div className="space-y-2">
                      <h2 className="text-2xl font-bold text-foreground tracking-tight leading-tight">
                        How can I help{user?.name ? `, ${user.name.split(" ")[0]}` : ""}?
                      </h2>
                      <p className="text-[13px] text-muted-foreground max-w-sm mx-auto leading-relaxed">
                        I can analyze your inbox, draft email responses, outline your schedule, or schedule calendar events.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5 w-full">
                    {SUGGESTION_LABELS.map((label, i) => (
                      <button
                        key={label}
                        onClick={() => sendMessage(SUGGESTIONS[i])}
                        className="text-left px-4 py-3.5 text-xs text-muted-foreground hover:text-foreground bg-secondary/30 hover:bg-secondary/60 border border-border/30 hover:border-border/50 rounded-2xl transition-all cursor-pointer shadow-sm hover:shadow-md"
                      >
                        <p className="font-semibold text-foreground/80">{label}</p>
                        <p className="text-[10px] text-muted-foreground/50 truncate mt-1">Tap to send</p>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="max-w-3xl mx-auto space-y-4">
                  {messages.map((msg, i) => (
                    <AIChatBubble key={i} message={msg} />
                  ))}
                  <div ref={bottomRef} />
                </div>
              )}
            </div>

            {/* Input Bar */}
            <div className="px-5 py-4 border-t border-border/40 shrink-0 bg-card/70 backdrop-blur-sm relative z-10">
              <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
                <div className="flex items-end gap-2 bg-secondary/30 border border-border/50 focus-within:border-ai/30 focus-within:bg-secondary/50 focus-within:ring-2 focus-within:ring-ai/8 rounded-2xl pl-4 pr-2 py-2 shadow-sm transition-all duration-200">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask about your emails or calendar…"
                    rows={1}
                    disabled={streaming}
                    className="flex-1 text-[13px] text-foreground bg-transparent outline-none resize-none placeholder:text-muted-foreground/40 leading-relaxed max-h-36 overflow-y-auto disabled:opacity-50 py-1.5 caret-ai"
                    style={{ fieldSizing: "content" } as any}
                  />
                  <Button
                    type="submit"
                    size="icon-sm"
                    disabled={!input.trim() || streaming}
                    className="shrink-0 mb-0.5 rounded-xl size-8 cursor-pointer disabled:opacity-30 bg-foreground hover:bg-foreground/90 text-background shadow-md"
                  >
                    <Send className="size-4" strokeWidth={1.75} />
                  </Button>
                </div>
                <p className="text-[10px] text-muted-foreground/40 text-center mt-2">
                  Enter to send · Shift+Enter for newline
                </p>
              </form>
            </div>
          </div>
        </div>
      </div>

      <SettingsOverlay
        user={user}
        gmailConnected={gmailConnected}
        calendarConnected={calendarConnected}
      />
    </div>
  );
}

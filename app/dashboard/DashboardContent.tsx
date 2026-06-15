"use client";

import { authClient } from "@/lib/auth-client";
import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import CategoryTabs, { type Category } from "@/components/email/CategoryTabs";
import ComposeModal from "@/components/email/ComposeModal";
import EmailDetail from "@/components/email/EmailDetail";
import EmailList from "@/components/email/EmailList";
import Pagination from "@/components/email/Pagination";
import SearchBar from "@/components/email/SearchBar";
import CommandPalette from "@/components/layout/CommandPalette";
import KeyboardShortcutsModal from "@/components/layout/KeyboardShortcutsModal";
import Sidebar from "@/components/layout/Sidebar";
import TopNav from "@/components/layout/TopNav";
import SettingsOverlay from "@/components/layout/SettingsOverlay";
import WalkthroughTour from "@/components/onboarding/WalkthroughTour";

type Mode = "inbox" | "search";

interface FetchOptions {
  token: string;
  mode: Mode;
  query?: string;
  category?: Category | string;
}

// Module-level cache — survives re-renders and page navigation within the session
const pageCache = new Map<string, { messages: any[]; nextPageToken: string | null }>();

function cacheKey(mode: Mode, token: string, query?: string, category?: string) {
  return `${mode}:${category ?? "inbox"}:${token}:${query ?? ""}`;
}

export default function DashboardContent({
  gmailConnected,
  calendarConnected,
}: {
  gmailConnected: boolean;
  calendarConnected: boolean;
}) {
  const { data: session } = authClient.useSession();
  const searchParams = useSearchParams();
  const router = useRouter();
  const folder = searchParams.get("folder") ?? "inbox";

  const [emails, setEmails] = useState<any[]>([]);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [tokenHistory, setTokenHistory] = useState<string[]>([""]);
  const [pageIndex, setPageIndex] = useState(0);

  const [selectedEmail, setSelectedEmail] = useState<any | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [showCompose, setShowCompose] = useState(false);
  const [showPalette, setShowPalette] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [hasSeenTour, setHasSeenTour] = useState(true); // default true to avoid flash
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [activeCategory, setActiveCategory] = useState<Category>("primary");
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [replyKey, setReplyKey] = useState(0);
  const [emailPriorities, setEmailPriorities] = useState<Record<string, string>>({});
  const analyzedIds = useRef<Set<string>>(new Set());

  // Resizable split pane
  const containerRef = useRef<HTMLDivElement>(null);
  const listPaneRef = useRef<HTMLDivElement>(null);
  const [listWidth, setListWidth] = useState<number | null>(null);
  const [dragging, setDragging] = useState(false);

  const handleDragStart = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!containerRef.current || !listPaneRef.current) return;

    // Capture starting metrics once — no React state reads during drag
    const startX = e.clientX;
    const startWidth = listPaneRef.current.getBoundingClientRect().width;

    setDragging(true);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    const onMouseMove = (ev: MouseEvent) => {
      if (!containerRef.current || !listPaneRef.current) return;
      const containerWidth = containerRef.current.getBoundingClientRect().width;
      const min = 280;
      const max = containerWidth - 320;
      const clamped = Math.max(min, Math.min(startWidth + (ev.clientX - startX), max));
      // Direct DOM write — skips React re-render entirely during drag
      listPaneRef.current.style.width = `${clamped}px`;
    };

    const stop = () => {
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", stop);
      // Commit final value to React state once on release
      if (listPaneRef.current) {
        const final = parseFloat(listPaneRef.current.style.width);
        if (!isNaN(final)) setListWidth(final);
      }
      setDragging(false);
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", stop);
  };

  const fetchPage = async ({ token, mode, query, category }: FetchOptions) => {
    setError(null);
    setSelectedEmail(null);

    const activeCat = category || (folder === "inbox" ? activeCategory : folder);
    const key = cacheKey(mode, token, query, activeCat);
    const cached = pageCache.get(key);
    if (cached) {
      setEmails(cached.messages);
      setNextPageToken(cached.nextPageToken);
      setLoading(false);
    } else {
      setEmails([]);
      setLoading(true);
    }

    try {
      let data: any;
      if (mode === "search" && query) {
        const qs = new URLSearchParams({ q: query });
        if (token) qs.set("pageToken", token);
        const res = await fetch(`/api/search?${qs}`);
        data = await res.json();
      } else {
        const qs = new URLSearchParams();
        if (token) qs.set("pageToken", token);
        qs.set("category", activeCat);
        const res = await fetch(`/api/emails?${qs}`);
        data = await res.json();
      }
      const messages = data.messages ?? [];
      const nextToken = data.nextPageToken ?? null;
      pageCache.set(key, { messages, nextPageToken: nextToken });
      setEmails(messages);
      setNextPageToken(nextToken);
    } catch {
      if (!cached) setError("Failed to load emails.");
    } finally {
      setLoading(false);
    }
  };

  // Load user tour preference on mount
  useEffect(() => {
    fetch("/api/preferences")
      .then((r) => r.json())
      .then((d) => setHasSeenTour(d.hasSeenTour ?? false))
      .catch(() => setHasSeenTour(true));
  }, []);

  const handleTourComplete = () => {
    setHasSeenTour(true);
    fetch("/api/preferences", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hasSeenTour: true }),
    }).catch(() => {});
  };

  // Trigger loading when folder changes
  useEffect(() => {
    setTokenHistory([""]);
    setPageIndex(0);
    setIsSearchMode(false);
    setSearchQuery("");
    fetchPage({ token: "", mode: "inbox", category: folder });
  }, [folder]); // eslint-disable-line react-hooks/exhaustive-deps

  // Global shortcuts: ⌘K → palette, Alt+A → AI, ? → shortcuts help
  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setShowPalette((prev) => !prev);
        return;
      }
      if (e.altKey && e.key === "a") {
        e.preventDefault();
        router.push("/dashboard/ai");
        return;
      }
      const tag = (e.target as HTMLElement).tagName.toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select") return;
      if (e.key === "?") {
        e.preventDefault();
        setShowShortcuts((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, [router]);

  // Batch-analyze up to 5 unread emails for AI priority badges
  useEffect(() => {
    if (!emails.length || isSearchMode) return;
    const unread = emails
      .filter((e) => e.labelIds?.includes("UNREAD") && !analyzedIds.current.has(e.id))
      .slice(0, 5);
    if (!unread.length) return;
    unread.forEach(async (email) => {
      analyzedIds.current.add(email.id);
      try {
        const res = await fetch("/api/ai/analyze-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ emailId: email.id }),
        });
        if (!res.ok) return;
        const data = await res.json();
        if (data.priority) {
          setEmailPriorities((prev) => ({ ...prev, [email.id]: data.priority }));
        }
      } catch {
        // silent — priority badge is non-critical
      }
    });
  }, [emails, isSearchMode]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-refresh every 60s — silently updates page 1, non-search only
  useEffect(() => {
    const interval = setInterval(async () => {
      if (isSearchMode || pageIndex !== 0) return;
      const activeCat = folder === "inbox" ? activeCategory : folder;
      try {
        const qs = new URLSearchParams({ category: activeCat });
        const res = await fetch(`/api/emails?${qs}`);
        const data = await res.json();
        if (data.messages) {
          const key = cacheKey("inbox", "", undefined, activeCat);
          pageCache.set(key, { messages: data.messages, nextPageToken: data.nextPageToken ?? null });
          setEmails(data.messages);
          if (data.nextPageToken !== undefined) setNextPageToken(data.nextPageToken ?? null);
        }
      } catch {
        // silent — don't surface auto-refresh errors to the user
      }
    }, 60_000);
    return () => clearInterval(interval);
  }, [isSearchMode, pageIndex, folder, activeCategory]); // eslint-disable-line react-hooks/exhaustive-deps

  // Keyboard shortcuts — J/K navigate, E archive, R reply, C compose, Esc close
  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const tag = target.tagName.toLowerCase();
      // Skip when focus is inside a form element or the command palette is open
      if (tag === "input" || tag === "textarea" || tag === "select") return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      if (e.key === "j") {
        e.preventDefault();
        const next = Math.min(focusedIndex + 1, emails.length - 1);
        if (next >= 0 && emails[next]) handleSelectEmail(emails[next]);
      }
      if (e.key === "k") {
        e.preventDefault();
        const next = Math.max(focusedIndex - 1, 0);
        if (emails[next]) handleSelectEmail(emails[next]);
      }
      if ((e.key === "e" || e.key === "E") && selectedEmail) {
        handleArchiveEmail();
      }
      if ((e.key === "r" || e.key === "R") && selectedEmail) {
        setReplyKey((k) => k + 1);
      }
      if (e.key === "c" || e.key === "C") {
        setShowCompose(true);
      }
      if (e.key === "Escape" && selectedEmail) {
        setSelectedEmail(null);
      }
    };
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, [emails, focusedIndex, selectedEmail]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCategoryChange = (category: Category) => {
    setActiveCategory(category);
    setTokenHistory([""]);
    setPageIndex(0);
    setIsSearchMode(false);
    setSearchQuery("");
    fetchPage({ token: "", mode: "inbox", category });
  };

  const goToNext = () => {
    if (!nextPageToken) return;
    const newIndex = pageIndex + 1;
    if (newIndex >= tokenHistory.length) {
      setTokenHistory((prev) => [...prev, nextPageToken]);
    }
    setPageIndex(newIndex);
    fetchPage({
      token: nextPageToken,
      mode: isSearchMode ? "search" : "inbox",
      query: searchQuery,
      category: folder === "inbox" ? activeCategory : folder,
    });
  };

  const goToPrev = () => {
    if (pageIndex === 0) return;
    const newIndex = pageIndex - 1;
    const token = tokenHistory[newIndex];
    setPageIndex(newIndex);
    fetchPage({
      token,
      mode: isSearchMode ? "search" : "inbox",
      query: searchQuery,
      category: folder === "inbox" ? activeCategory : folder,
    });
  };

  const handleSearch = async (q: string) => {
    setSearchQuery(q);
    setIsSearchMode(true);
    setTokenHistory([""]);
    setPageIndex(0);
    await fetchPage({ token: "", mode: "search", query: q });
  };

  const handleClearSearch = async () => {
    setSearchQuery("");
    setIsSearchMode(false);
    setTokenHistory([""]);
    setPageIndex(0);
    await fetchPage({ token: "", mode: "inbox", category: folder === "inbox" ? activeCategory : folder });
  };

  const handleSelectEmail = async (email: any) => {
    // Track focused index for keyboard nav
    const idx = emails.findIndex((e) => e.id === email.id);
    if (idx !== -1) setFocusedIndex(idx);

    setDetailLoading(true);
    setSelectedEmail(null);
    try {
      const res = await fetch(`/api/emails/${email.id}`);
      if (!res.ok) return;
      const data = await res.json();
      if (data.message) {
        setSelectedEmail(data.message);
        // Optimistically mark as read in local list
        if (email.labelIds?.includes("UNREAD")) {
          setEmails((prev) =>
            prev.map((e) =>
              e.id === email.id
                ? { ...e, labelIds: (e.labelIds ?? []).filter((l: string) => l !== "UNREAD") }
                : e
            )
          );
          // Fire-and-forget — PATCH endpoint handles Gmail label removal
          fetch(`/api/emails/${email.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ removeLabelIds: ["UNREAD"] }),
          }).catch(() => {});
        }
      }
    } catch {
      // silently fail — detail pane stays closed
    } finally {
      setDetailLoading(false);
    }
  };

  const handleArchiveEmail = async () => {
    if (!selectedEmail) return;
    const id = selectedEmail.id;
    // Optimistically remove from list and close pane
    setSelectedEmail(null);
    setEmails((prev) => prev.filter((e) => e.id !== id));
    fetch(`/api/emails/${id}/archive`, { method: "POST" }).catch(() => {});
  };

  const handleEmailDeleted = () => {
    const id = selectedEmail?.id;
    setSelectedEmail(null);
    if (id) setEmails((prev) => prev.filter((e) => e.id !== id));
  };

  const handleBulkDelete = (ids: string[]) => {
    setEmails((prev) => prev.filter((e) => !ids.includes(e.id)));
    if (selectedEmail && ids.includes(selectedEmail.id)) setSelectedEmail(null);
  };

  const hasDetail = selectedEmail !== null || detailLoading;

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Left Sidebar */}
      <Sidebar
        user={session?.user}
        onCompose={() => setShowCompose(true)}
        gmailConnected={gmailConnected}
        calendarConnected={calendarConnected}
      />

      {/* Main Workspace Frame */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Top Navigation Bar */}
        <TopNav
          user={session?.user}
          gmailConnected={gmailConnected}
          onOpenPalette={() => setShowPalette(true)}
        />

        {/* Outer card container with margin spacing */}
        <div ref={containerRef} className="flex-1 flex overflow-hidden p-4 pt-0 gap-4">
          
          {/* Email list pane */}
          <div
            ref={listPaneRef}
            className={`flex flex-col bg-card border border-border/40 rounded-xl overflow-hidden shrink-0 shadow-xl relative z-20 ${dragging ? "" : "transition-[width,flex] duration-200"}`}
            style={
              hasDetail
                ? { width: listWidth !== null ? `${listWidth}px` : "42%", flex: "none" }
                : { flex: 1 }
            }
          >
            {/* Card header — folder title + count */}
            <div className="px-5 py-3.5 border-b border-border/40 shrink-0 flex items-center justify-between bg-card/60 backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-serif text-foreground capitalize tracking-tight leading-none">
                  {isSearchMode ? "Search results" : folder}
                </h1>
                {!loading && emails.length > 0 && (
                  <span className="text-[10px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded font-mono">
                    {emails.length}
                  </span>
                )}
              </div>
              {isSearchMode && (
                <span className="text-[11px] text-muted-foreground/60 truncate max-w-45">
                  &ldquo;{searchQuery}&rdquo;
                </span>
              )}
            </div>

            {/* Search bar */}
            <div id="tour-search" className="px-4 py-2.5 border-b border-border/30 shrink-0 bg-card/40">
              <SearchBar onSearch={handleSearch} onClear={handleClearSearch} />
            </div>

            {/* Smart Category Tabs — only shown for Inbox */}
            {!isSearchMode && folder === "inbox" && (
              <CategoryTabs active={activeCategory} onChange={handleCategoryChange} loading={loading} />
            )}

            {/* Email list container */}
            <div id="tour-inbox" className="flex-1 overflow-y-auto">
              {error ? (
                <div className="p-8 text-center text-destructive text-xs font-medium">{error}</div>
              ) : (
                <EmailList
                  emails={emails}
                  selectedId={selectedEmail?.id}
                  onSelect={handleSelectEmail}
                  isSearchMode={isSearchMode}
                  searchQuery={searchQuery}
                  loading={loading}
                  onBulkDelete={handleBulkDelete}
                  emailPriorities={emailPriorities}
                />
              )}
            </div>

            {/* Pagination Controls */}
            {!error && (
              <Pagination
                page={pageIndex + 1}
                hasPrev={pageIndex > 0}
                hasNext={!!nextPageToken}
                onPrev={goToPrev}
                onNext={goToNext}
                loading={loading}
              />
            )}
          </div>

          {/* Resizable Divider Drag Handle */}
          {hasDetail && (
            <div
              onMouseDown={handleDragStart}
              className="w-1.5 shrink-0 bg-transparent hover:bg-indigo-500/10 active:bg-indigo-500/20 cursor-col-resize transition-all duration-150 flex items-center justify-center group"
              title="Drag to resize panels"
            >
              <div className="w-0.5 h-8 rounded-full bg-border/50 group-hover:bg-indigo-500/40 group-active:bg-indigo-500/60" />
            </div>
          )}

          {/* Email Reading Detail Pane */}
          {hasDetail && (
            <div className="flex-1 bg-card border border-border/40 rounded-xl overflow-hidden shadow-xl min-w-0 transition-all duration-300 relative z-10 flex flex-col">
              {detailLoading ? (
                <div className="p-8 space-y-6 flex-1 flex flex-col">
                  {/* Skeleton detail loader */}
                  <div className="flex gap-4 items-start shrink-0">
                    <div className="size-10 rounded-full bg-secondary animate-pulse" />
                    <div className="flex-1 space-y-2.5">
                      <div className="h-4 bg-secondary animate-pulse w-2/3 rounded-lg" />
                      <div className="h-3 bg-secondary animate-pulse w-1/3 rounded" />
                    </div>
                  </div>
                  <div className="border-t border-border/40 pt-6 space-y-3 flex-1 overflow-hidden">
                    <div className="h-3 bg-secondary animate-pulse w-full rounded" />
                    <div className="h-3 bg-secondary animate-pulse w-5/6 rounded" />
                    <div className="h-3 bg-secondary animate-pulse w-4/5 rounded" />
                    <div className="h-3 bg-secondary animate-pulse w-full rounded" />
                    <div className="h-3 bg-secondary animate-pulse w-1/2 rounded" />
                  </div>
                </div>
              ) : (
                <EmailDetail
                  email={selectedEmail}
                  onClose={() => setSelectedEmail(null)}
                  onDelete={handleEmailDeleted}
                  onArchive={handleArchiveEmail}
                  replyKey={replyKey}
                />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Compose Overlay Modal */}
      {showCompose && <ComposeModal onClose={() => setShowCompose(false)} />}

      {/* Settings Panel Sheet */}
      <SettingsOverlay
        user={session?.user}
        gmailConnected={gmailConnected}
        calendarConnected={calendarConnected}
      />

      {/* Command Palette — ⌘K spotlight search */}
      <CommandPalette
        open={showPalette}
        onClose={() => setShowPalette(false)}
        onSelectEmail={handleSelectEmail}
      />

      {/* Keyboard Shortcuts — ? key */}
      <KeyboardShortcutsModal
        open={showShortcuts}
        onClose={() => setShowShortcuts(false)}
      />

      {/* Onboarding tour — fires once for new users */}
      <WalkthroughTour hasSeenTour={hasSeenTour} onTourComplete={handleTourComplete} />

      {/* Dragging Overlay */}
      {dragging && (
        <div className="fixed inset-0 z-50 cursor-col-resize bg-transparent" />
      )}
    </div>
  );
}

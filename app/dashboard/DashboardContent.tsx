"use client";

import { authClient } from "@/lib/auth-client";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import CategoryTabs, { type Category } from "@/components/email/CategoryTabs";
import ComposeModal from "@/components/email/ComposeModal";
import EmailDetail from "@/components/email/EmailDetail";
import EmailList from "@/components/email/EmailList";
import Pagination from "@/components/email/Pagination";
import SearchBar from "@/components/email/SearchBar";
import CommandPalette from "@/components/layout/CommandPalette";
import KeyboardShortcutsModal from "@/components/layout/KeyboardShortcutsModal";
import ReconnectBanner from "@/components/layout/ReconnectBanner";
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

import { emailCache as pageCache, clearAllCaches, prefetchCalendar, prefetchDrafts } from "@/lib/client-cache";

function cacheKey(userId: string, mode: Mode, token: string, query?: string, category?: string) {
  return `${userId}:${mode}:${category ?? "inbox"}:${token}:${query ?? ""}`;
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
  const [gmailExpired, setGmailExpired] = useState(false);

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
    const userId = session?.user?.id ?? "";
    setError(null);
    setSelectedEmail(null);

    const activeCat = category || (folder === "inbox" ? activeCategory : folder);
    const key = cacheKey(userId, mode, token, query, activeCat);
    const cached = pageCache.get(key);
    if (cached) {
      setEmails(cached.messages);
      setNextPageToken(cached.nextPageToken);
      setLoading(false);
      // Data is fresh — the webhook poll will catch any new mail. Skip the
      // background re-fetch entirely so tab switches feel instant.
      if (cached.fetchedAt > 0) return; // cache is session-scoped (Infinity TTL)
    } else {
      setEmails([]);
      setLoading(true);
    }

    try {
      let res: Response;
      let data: any;
      if (mode === "search" && query) {
        const qs = new URLSearchParams({ q: query });
        if (token) qs.set("pageToken", token);
        res = await fetch(`/api/search?${qs}`);
      } else {
        const qs = new URLSearchParams();
        if (token) qs.set("pageToken", token);
        qs.set("category", activeCat);
        res = await fetch(`/api/emails?${qs}`);
      }
      data = await res.json();
      if (res.status === 401 && data?.error === "connection_expired") {
        setGmailExpired(true);
        return;
      }
      setGmailExpired(false);
      const messages = data.messages ?? [];
      const nextToken = data.nextPageToken ?? null;
      pageCache.set(key, { messages, nextPageToken: nextToken, fetchedAt: Date.now() });
      setEmails(messages);
      setNextPageToken(nextToken);
    } catch {
      if (!cached) setError("Failed to load emails.");
    } finally {
      setLoading(false);
    }
  };

  // Clear all shared caches when the logged-in user changes.
  useEffect(() => {
    clearAllCaches();
  }, [session?.user?.id]);

  // Background-prefetch Calendar and Drafts data while the user browses emails.
  // By the time they click the sidebar link, data is already cached and the
  // page renders instantly without waiting for a network round-trip.
  useEffect(() => {
    const userId = session?.user?.id;
    if (!userId) return;
    if (calendarConnected) prefetchCalendar(userId);
    prefetchDrafts(userId);
  }, [session?.user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Synchronously hydrate from cache before the browser paints when the folder
  // changes. useEffect fires *after* paint, which causes a one-frame flash of
  // stale data. useLayoutEffect fires before paint, making tab switches instant.
  useLayoutEffect(() => {
    const userId = session?.user?.id;
    if (!userId) return;
    const activeCat = folder === "inbox" ? activeCategory : folder;
    const key = cacheKey(userId, "inbox", "", undefined, activeCat);
    const cached = pageCache.get(key);
    if (cached) {
      setEmails(cached.messages);
      setNextPageToken(cached.nextPageToken);
      setLoading(false);
      setSelectedEmail(null);
    }
  }, [folder]); // eslint-disable-line react-hooks/exhaustive-deps

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


  // Webhook-driven inbox refresh — poll every 30s, only re-fetch if Corsair signals a change
  useEffect(() => {
    if (!session?.user?.id) return;
    const userId = session.user.id;
    let lastChecked = new Date().toISOString();

    const interval = setInterval(async () => {
      if (isSearchMode || pageIndex !== 0) return;
      try {
        const qs = new URLSearchParams({ userId, since: lastChecked });
        const res = await fetch(`/api/webhooks/gmail?${qs}`);
        const data = await res.json();
        lastChecked = new Date().toISOString();
        if (!data.hasUpdate) return;

        // New mail detected — silently refresh page 1
        const activeCat = folder === "inbox" ? activeCategory : folder;
        const emailRes = await fetch(`/api/emails?${new URLSearchParams({ category: activeCat })}`);
        const emailData = await emailRes.json();
        if (emailData.messages) {
          const key = cacheKey(userId, "inbox", "", undefined, activeCat);
          pageCache.set(key, { messages: emailData.messages, nextPageToken: emailData.nextPageToken ?? null, fetchedAt: Date.now() });
          setEmails(emailData.messages);
          if (emailData.nextPageToken !== undefined) setNextPageToken(emailData.nextPageToken ?? null);
        }
      } catch {
        // silent
      }
    }, 30_000);
    return () => clearInterval(interval);
  }, [session?.user?.id, isSearchMode, pageIndex, folder, activeCategory]); // eslint-disable-line react-hooks/exhaustive-deps

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
        handleArchiveEmail(true); // keyboard shortcut must fire the API itself
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

  // Removes the email from local state and cache only.
  // Callers are responsible for the API call so EmailDetail's archive/unarchive
  // button (which already makes its own PATCH/POST) doesn't double-fire.
  const handleArchiveEmail = (apiCall = false) => {
    if (!selectedEmail) return;
    const id = selectedEmail.id;
    const userId = session?.user?.id ?? "";
    setSelectedEmail(null);
    setEmails((prev) => prev.filter((e) => e.id !== id));

    for (const [key, val] of pageCache.entries()) {
      if (val.messages.some((m: any) => m.id === id)) {
        pageCache.set(key, { ...val, messages: val.messages.filter((m: any) => m.id !== id) });
      }
    }

    // Invalidate archive cache so the next visit re-fetches fresh from Gmail.
    for (const key of pageCache.keys()) {
      if (key.startsWith(`${userId}:inbox:archive:`)) pageCache.delete(key);
    }

    // Only fire the API when called from the keyboard shortcut (not from EmailDetail,
    // which has already made the correct archive/unarchive request itself).
    if (apiCall) {
      fetch(`/api/emails/${id}/archive`, { method: "POST" }).catch(() => {});
    }
  };

  const handleEmailDeleted = () => {
    const id = selectedEmail?.id;
    setSelectedEmail(null);
    if (!id) return;
    setEmails((prev) => prev.filter((e) => e.id !== id));
    for (const [key, val] of pageCache.entries()) {
      if (val.messages.some((m: any) => m.id === id)) {
        pageCache.set(key, { ...val, messages: val.messages.filter((m: any) => m.id !== id) });
      }
    }
  };

  const handleBulkDelete = (ids: string[]) => {
    setEmails((prev) => prev.filter((e) => !ids.includes(e.id)));
    if (selectedEmail && ids.includes(selectedEmail.id)) setSelectedEmail(null);
  };

  const handleStar = (id: string, starred: boolean) => {
    const userId = session?.user?.id ?? "";

    const toggleLabels = (labelIds: string[]) =>
      starred
        ? [...labelIds.filter((l) => l !== "STARRED"), "STARRED"]
        : labelIds.filter((l) => l !== "STARRED");

    // Update the visible list. When unstarring inside the Starred folder the
    // email no longer belongs there, so filter it out entirely.
    setEmails((prev) => {
      if (!starred && folder === "starred") {
        return prev.filter((e) => e.id !== id);
      }
      return prev.map((e) =>
        e.id === id ? { ...e, labelIds: toggleLabels(e.labelIds ?? []) } : e
      );
    });

    // Patch every cache entry that contains this email.
    for (const [key, val] of pageCache.entries()) {
      const isStarredCache = key.startsWith(`${userId}:inbox:starred:`);
      const idx = val.messages.findIndex((m: any) => m.id === id);

      if (isStarredCache) {
        if (!starred && idx !== -1) {
          // Remove from starred cache when unstarring
          pageCache.set(key, { ...val, messages: val.messages.filter((m: any) => m.id !== id) });
        } else if (starred && idx === -1) {
          // Add to starred cache when starring so navigating there is instant
          const src = emails.find((e) => e.id === id);
          if (src) {
            const updated = { ...src, labelIds: toggleLabels(src.labelIds ?? []) };
            pageCache.set(key, { ...val, messages: [updated, ...val.messages] });
          }
        }
      } else if (idx !== -1) {
        const updated = [...val.messages];
        updated[idx] = { ...updated[idx], labelIds: toggleLabels(updated[idx].labelIds ?? []) };
        pageCache.set(key, { ...val, messages: updated });
      }
    }

    // Sync with Gmail API (fire-and-forget)
    fetch(`/api/emails/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(starred ? { addLabelIds: ["STARRED"] } : { removeLabelIds: ["STARRED"] }),
    }).catch(() => {});
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
        onPrefetchFolder={(id) => {
          const userId = session?.user?.id;
          if (!userId) return;
          if (id === "calendar" && calendarConnected) prefetchCalendar(userId);
          if (id === "drafts") prefetchDrafts(userId);
        }}
      />

      {/* Main Workspace Frame */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Top Navigation Bar */}
        <TopNav
          user={session?.user}
          gmailConnected={gmailConnected}
          onOpenPalette={() => setShowPalette(true)}
        />

        {gmailExpired && <ReconnectBanner plugin="gmail" />}

        {/* Seamless workspace — single card, no gap between panes */}
        <div ref={containerRef} className="flex-1 flex overflow-hidden p-2 md:p-4 pt-0">
          <div className="flex-1 flex min-w-0 bg-card border border-border/40 rounded-xl shadow-xl overflow-hidden">

            {/* Email list pane — hidden on mobile when detail is open */}
            <div
              ref={listPaneRef}
              className={`flex flex-col shrink-0 relative z-20 overflow-hidden
                ${hasDetail
                  ? "hidden md:flex border-r border-border/40"
                  : "flex-1"
                }
                ${dragging ? "" : "transition-[width] duration-200"}
              `}
              style={hasDetail ? (listWidth !== null ? { width: `${listWidth}px` } : { width: "42%" }) : {}}
            >
              {/* Card header — folder title + count */}
              <div className="px-5 py-3.5 border-b border-border/40 shrink-0 flex items-center justify-between bg-card/60 backdrop-blur-sm">
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-semibold text-foreground capitalize tracking-tight leading-none">
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
                    onStar={handleStar}
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

            {/* Resize drag handle — desktop only */}
            {hasDetail && (
              <div
                onMouseDown={handleDragStart}
                className="hidden md:flex w-1.5 shrink-0 cursor-col-resize hover:bg-primary/10 active:bg-primary/20 transition-colors duration-150 items-center justify-center group z-30"
                title="Drag to resize"
              >
                <div className="w-px h-8 rounded-full bg-border/70 group-hover:bg-primary/50 transition-colors" />
              </div>
            )}

            {/* Email Reading Detail Pane */}
            {hasDetail && (
              <div className="flex-1 min-w-0 overflow-hidden flex flex-col">
                {/* Mobile: back button to return to list */}
                <div className="md:hidden flex items-center gap-2 px-4 py-2.5 border-b border-border/40 shrink-0 bg-card/60">
                  <button
                    onClick={() => setSelectedEmail(null)}
                    className="flex items-center gap-1.5 text-[13px] font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  >
                    ← Back to inbox
                  </button>
                </div>
                {detailLoading ? (
                  <div className="p-8 space-y-6 flex-1 flex flex-col">
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
                    onArchive={() => handleArchiveEmail(false)}
                    replyKey={replyKey}
                    onAnalyzed={(emailId, priority) =>
                      setEmailPriorities((prev) => ({ ...prev, [emailId]: priority }))
                    }
                  />
                )}
              </div>
            )}
          </div>
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

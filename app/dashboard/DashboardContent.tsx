"use client";

import { authClient } from "@/lib/auth-client";
import { useEffect, useRef, useState } from "react";
import CategoryTabs, { type Category } from "@/components/dashboard/CategoryTabs";
import ComposeModal from "@/components/dashboard/ComposeModal";
import EmailDetail from "@/components/dashboard/EmailDetail";
import EmailList from "@/components/dashboard/EmailList";
import Pagination from "@/components/dashboard/Pagination";
import SearchBar from "@/components/dashboard/SearchBar";
import Sidebar from "@/components/dashboard/Sidebar";

type Mode = "inbox" | "search";

interface FetchOptions {
  token: string;
  mode: Mode;
  query?: string;
  category?: Category;
}

// Module-level cache — survives re-renders and page navigation within the session
const pageCache = new Map<string, { messages: any[]; nextPageToken: string | null }>();

function cacheKey(mode: Mode, token: string, query?: string, category?: Category) {
  return `${mode}:${category ?? "primary"}:${token}:${query ?? ""}`;
}

export default function DashboardContent({
  gmailConnected,
  calendarConnected,
}: {
  gmailConnected: boolean;
  calendarConnected: boolean;
}) {
  const { data: session } = authClient.useSession();

  const [emails, setEmails] = useState<any[]>([]);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [tokenHistory, setTokenHistory] = useState<string[]>([""]);
  const [pageIndex, setPageIndex] = useState(0);

  const [selectedEmail, setSelectedEmail] = useState<any | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [showCompose, setShowCompose] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [activeCategory, setActiveCategory] = useState<Category>("primary");

  // Resizable split pane
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const [listWidth, setListWidth] = useState<number | null>(null);
  const [dragging, setDragging] = useState(false);

  const handleDragStart = (e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = true;
    setDragging(true);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    const stop = () => {
      isDragging.current = false;
      setDragging(false);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", stop);
    };

    const onMouseMove = (ev: MouseEvent) => {
      if (ev.buttons !== 1) { stop(); return; }
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const newWidth = ev.clientX - rect.left;
      const min = 260;
      const max = rect.width - 320;
      setListWidth(Math.max(min, Math.min(newWidth, max)));
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", stop);
  };

  const fetchPage = async ({ token, mode, query, category }: FetchOptions) => {
    setError(null);
    setSelectedEmail(null);

    const key = cacheKey(mode, token, query, category);
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
        qs.set("category", category ?? "primary");
        const res = await fetch(`/api/emails?${qs}`);
        data = await res.json();
      }
      const messages = data.messages ?? [];
      const nextToken = data.nextPageToken ?? null;
      pageCache.set(key, { messages, nextPageToken: nextToken });
      setEmails(messages);
      setNextPageToken(nextToken);
    } catch {
      if (!cached) setError("Failed to load.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPage({ token: "", mode: "inbox", category: "primary" });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
      category: activeCategory,
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
      category: activeCategory,
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
    await fetchPage({ token: "", mode: "inbox", category: activeCategory });
  };

  const handleSelectEmail = async (email: any) => {
    setDetailLoading(true);
    setSelectedEmail(null);
    try {
      const res = await fetch(`/api/emails/${email.id}`);
      if (!res.ok) return;
      const data = await res.json();
      if (data.message) setSelectedEmail(data.message);
    } catch {
      // silently fail — detail pane stays closed
    } finally {
      setDetailLoading(false);
    }
  };

  const handleEmailDeleted = () => {
    const id = selectedEmail?.id;
    setSelectedEmail(null);
    if (id) setEmails((prev) => prev.filter((e) => e.id !== id));
  };

  const hasDetail = selectedEmail !== null || detailLoading;

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar user={session?.user} onCompose={() => setShowCompose(true)} gmailConnected={gmailConnected} calendarConnected={calendarConnected} />

      {/* Inner container: list + drag handle + detail */}
      <div ref={containerRef} className="flex flex-1 overflow-hidden">

        {/* Email list pane */}
        <div
          className="flex flex-col border-r overflow-hidden shrink-0"
          style={
            hasDetail
              ? { width: listWidth !== null ? `${listWidth}px` : "45%" }
              : { flex: 1 }
          }
        >
          {/* Search bar */}
          <div className="px-4 py-2.5 border-b shrink-0">
            <SearchBar onSearch={handleSearch} onClear={handleClearSearch} />
          </div>

          {/* Category tabs — hidden in search mode */}
          {!isSearchMode && (
            <CategoryTabs active={activeCategory} onChange={handleCategoryChange} loading={loading} />
          )}

          {/* Search mode label */}
          {isSearchMode && (
            <div className="px-4 py-1.5 border-b shrink-0 bg-muted/40">
              <p className="text-[10px] text-muted-foreground">
                Results for &quot;{searchQuery}&quot;
              </p>
            </div>
          )}

          {/* Email list */}
          <div className="flex-1 overflow-y-auto">
            {error ? (
              <div className="p-8 text-center text-destructive text-xs">{error}</div>
            ) : (
              <EmailList
                emails={emails}
                selectedId={selectedEmail?.id}
                onSelect={handleSelectEmail}
                isSearchMode={isSearchMode}
                searchQuery={searchQuery}
                loading={loading}
              />
            )}
          </div>

          {/* Pagination */}
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

        {/* Drag handle */}
        {hasDetail && (
          <div
            onMouseDown={handleDragStart}
            className="w-1.25 shrink-0 bg-border hover:bg-primary/40 active:bg-primary cursor-col-resize transition-colors"
            title="Drag to resize"
          />
        )}

        {/* Detail pane */}
        {hasDetail && (
          <div className="flex-1 overflow-hidden min-w-0">
            {detailLoading ? (
              <div className="p-6 space-y-4">
                <div className="flex gap-3 items-start">
                  <div className="size-8 rounded-full bg-muted animate-pulse shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-muted animate-pulse w-48 rounded" />
                    <div className="h-2.5 bg-muted animate-pulse w-32 rounded" />
                  </div>
                </div>
                <div className="space-y-2">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="h-3 bg-muted animate-pulse rounded" style={{ width: `${85 - i * 8}%` }} />
                  ))}
                </div>
              </div>
            ) : (
              <EmailDetail
                email={selectedEmail}
                onClose={() => setSelectedEmail(null)}
                onDelete={handleEmailDeleted}
              />
            )}
          </div>
        )}
      </div>

      {showCompose && <ComposeModal onClose={() => setShowCompose(false)} />}

      {/* Full-screen overlay during drag — prevents iframe from swallowing mouse events */}
      {dragging && (
        <div className="fixed inset-0 z-50 cursor-col-resize" />
      )}
    </div>
  );
}

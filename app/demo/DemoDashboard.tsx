"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import CategoryTabs, { type Category } from "@/components/email/CategoryTabs";
import ComposeModal from "@/components/email/ComposeModal";
import EmailDetail from "@/components/email/EmailDetail";
import EmailList from "@/components/email/EmailList";
import Pagination from "@/components/email/Pagination";
import SearchBar from "@/components/email/SearchBar";
import KeyboardShortcutsModal from "@/components/layout/KeyboardShortcutsModal";
import Sidebar from "@/components/layout/Sidebar";
import TopNav from "@/components/layout/TopNav";
import SettingsOverlay from "@/components/layout/SettingsOverlay";
import DemoBanner from "./DemoBanner";
import DemoSignInModal from "./DemoSignInModal";
import { useDemoContext } from "@/lib/demo/DemoContext";

// Label categories map
const CATEGORY_LABELS: Record<string, string> = {
  primary: "INBOX",
  promotions: "CATEGORY_PROMOTIONS",
  social: "CATEGORY_SOCIAL",
  updates: "CATEGORY_UPDATES",
  sent: "SENT",
  starred: "STARRED",
  archive: "__ARCHIVE__",
};

function filterByFolder(emails: any[], folder: string, category: Category): any[] {
  if (folder === "starred") return emails.filter((e) => (e.labelIds ?? []).includes("STARRED"));
  if (folder === "sent") return emails.filter((e) => (e.labelIds ?? []).includes("SENT"));
  if (folder === "archive") return emails.filter((e) => !(e.labelIds ?? []).includes("INBOX") && !(e.labelIds ?? []).includes("STARRED"));
  if (folder === "drafts") return [];
  // inbox
  const inboxEmails = emails.filter((e) => (e.labelIds ?? []).includes("INBOX"));
  if (category === "promotions") return inboxEmails.filter((e) => (e.labelIds ?? []).includes("CATEGORY_PROMOTIONS"));
  if (category === "social") return inboxEmails.filter((e) => (e.labelIds ?? []).includes("CATEGORY_SOCIAL"));
  if (category === "updates") return inboxEmails.filter((e) => (e.labelIds ?? []).includes("CATEGORY_UPDATES"));
  // primary — exclude other categories
  return inboxEmails.filter(
    (e) =>
      !(e.labelIds ?? []).includes("CATEGORY_PROMOTIONS") &&
      !(e.labelIds ?? []).includes("CATEGORY_SOCIAL") &&
      !(e.labelIds ?? []).includes("CATEGORY_UPDATES")
  );
}

function fuzzyMatch(email: any, query: string): boolean {
  const q = query.toLowerCase();
  const subject = email.payload?.headers?.find((h: any) => h.name === "Subject")?.value ?? "";
  const from = email.payload?.headers?.find((h: any) => h.name === "From")?.value ?? "";
  return (
    subject.toLowerCase().includes(q) ||
    from.toLowerCase().includes(q) ||
    (email.snippet ?? "").toLowerCase().includes(q)
  );
}

const PAGE_SIZE = 20;

export default function DemoDashboard() {
  const ctx = useDemoContext();
  const router = useRouter();
  const searchParams = useSearchParams();
  const folder = searchParams.get("folder") ?? "inbox";

  const [activeCategory, setActiveCategory] = useState<Category>("primary");
  const [selectedEmail, setSelectedEmail] = useState<any | null>(null);
  const [showCompose, setShowCompose] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [replyKey, setReplyKey] = useState(0);
  const [emailPriorities, setEmailPriorities] = useState<Record<string, string>>({});
  const [pageIndex, setPageIndex] = useState(0);

  // Resizable split pane
  const containerRef = useRef<HTMLDivElement>(null);
  const listPaneRef = useRef<HTMLDivElement>(null);
  const [listWidth, setListWidth] = useState<number | null>(null);
  const [dragging, setDragging] = useState(false);

  const handleDragStart = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!containerRef.current || !listPaneRef.current) return;
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
      listPaneRef.current.style.width = `${clamped}px`;
    };
    const stop = () => {
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", stop);
      if (listPaneRef.current) {
        const final = parseFloat(listPaneRef.current.style.width);
        if (!isNaN(final)) setListWidth(final);
      }
      setDragging(false);
    };
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", stop);
  };

  // Derive visible emails from demo state
  const visibleEmails = (() => {
    if (isSearchMode && searchQuery) {
      return ctx.emails.filter((e) => fuzzyMatch(e, searchQuery));
    }
    return filterByFolder(ctx.emails, folder, activeCategory);
  })();

  const pagedEmails = visibleEmails.slice(pageIndex * PAGE_SIZE, (pageIndex + 1) * PAGE_SIZE);
  const hasNext = (pageIndex + 1) * PAGE_SIZE < visibleEmails.length;
  const hasPrev = pageIndex > 0;

  // Reset page when folder/category/search changes
  useEffect(() => {
    setPageIndex(0);
    setSelectedEmail(null);
    setIsSearchMode(false);
    setSearchQuery("");
  }, [folder, activeCategory]);

  // Global keyboard shortcuts
  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        ctx.setShowSignInModal(true);
        return;
      }
      if (e.altKey && e.key === "a") {
        e.preventDefault();
        ctx.setShowSignInModal(true);
        return;
      }
      const tag = (e.target as HTMLElement).tagName.toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select") return;
      if (e.key === "?") {
        e.preventDefault();
        setShowShortcuts((p) => !p);
      }
    };
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, [ctx]);

  // J/K/E/R/C/Esc shortcuts
  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName.toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select") return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      if (e.key === "j") {
        e.preventDefault();
        const next = Math.min(focusedIndex + 1, pagedEmails.length - 1);
        if (next >= 0 && pagedEmails[next]) handleSelectEmail(pagedEmails[next]);
      }
      if (e.key === "k") {
        e.preventDefault();
        const next = Math.max(focusedIndex - 1, 0);
        if (pagedEmails[next]) handleSelectEmail(pagedEmails[next]);
      }
      if ((e.key === "e" || e.key === "E") && selectedEmail) handleArchiveEmail();
      if ((e.key === "r" || e.key === "R") && selectedEmail) setReplyKey((k) => k + 1);
      if (e.key === "c" || e.key === "C") setShowCompose(true);
      if (e.key === "Escape" && selectedEmail) setSelectedEmail(null);
    };
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, [pagedEmails, focusedIndex, selectedEmail]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCategoryChange = (category: Category) => {
    setActiveCategory(category);
    setPageIndex(0);
    setSelectedEmail(null);
    setIsSearchMode(false);
    setSearchQuery("");
  };

  const handleSearch = (q: string) => {
    setSearchQuery(q);
    setIsSearchMode(true);
    setPageIndex(0);
    setSelectedEmail(null);
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setIsSearchMode(false);
    setPageIndex(0);
    setSelectedEmail(null);
  };

  const handleSelectEmail = (email: any) => {
    const idx = pagedEmails.findIndex((e) => e.id === email.id);
    if (idx !== -1) setFocusedIndex(idx);
    // Mark as read immediately in local state
    ctx.markRead(email.id);
    // Get the latest version from context (which now has labelIds without UNREAD)
    const full = ctx.getEmailById(email.id) ?? email;
    setSelectedEmail({ ...full, labelIds: (full.labelIds ?? []).filter((l: string) => l !== "UNREAD") });
  };

  const handleArchiveEmail = () => {
    if (!selectedEmail) return;
    ctx.archiveEmail(selectedEmail.id);
    setSelectedEmail(null);
  };

  const handleEmailDeleted = () => {
    if (!selectedEmail) return;
    ctx.deleteEmail(selectedEmail.id);
    setSelectedEmail(null);
  };

  const handleBulkDelete = (ids: string[]) => {
    ctx.bulkDelete(ids);
    if (selectedEmail && ids.includes(selectedEmail.id)) setSelectedEmail(null);
  };

  const hasDetail = selectedEmail !== null;

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      <DemoBanner />

      <div className="flex flex-1 overflow-hidden min-h-0">
        {/* Left Sidebar — same component, just demo user + demo base paths */}
        <Sidebar
          user={ctx.user}
          onCompose={() => setShowCompose(true)}
          gmailConnected={true}
          calendarConnected={true}
          basePath="/demo"
        />

        {/* Main Workspace Frame */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          {/* Top Navigation Bar */}
          <TopNav
            user={ctx.user}
            gmailConnected={true}
            basePath="/demo"
            onOpenPalette={() => ctx.setShowSignInModal(true)}
          />

          {/* Workspace card */}
          <div ref={containerRef} className="flex-1 flex overflow-hidden p-2 md:p-4 pt-0">
            <div className="flex-1 flex min-w-0 bg-card border border-border/40 rounded-xl shadow-xl overflow-hidden">

              {/* Email list pane */}
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
                {/* Folder header */}
                <div className="px-5 py-3.5 border-b border-border/40 shrink-0 flex items-center justify-between bg-card/60 backdrop-blur-sm">
                  <div className="flex items-center gap-2">
                    <h1 className="text-lg font-semibold text-foreground capitalize tracking-tight leading-none">
                      {isSearchMode ? "Search results" : folder}
                    </h1>
                    {pagedEmails.length > 0 && (
                      <span className="text-[10px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded font-mono">
                        {pagedEmails.length}
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
                <div className="px-4 py-2.5 border-b border-border/30 shrink-0 bg-card/40">
                  <SearchBar onSearch={handleSearch} onClear={handleClearSearch} />
                </div>

                {/* Category tabs — inbox only */}
                {!isSearchMode && folder === "inbox" && (
                  <CategoryTabs active={activeCategory} onChange={handleCategoryChange} loading={false} />
                )}

                {/* Email list */}
                <div className="flex-1 overflow-y-auto">
                  <EmailList
                    emails={pagedEmails}
                    selectedId={selectedEmail?.id}
                    onSelect={handleSelectEmail}
                    isSearchMode={isSearchMode}
                    searchQuery={searchQuery}
                    loading={false}
                    onBulkDelete={handleBulkDelete}
                    emailPriorities={emailPriorities}
                    isDemo
                    onStar={(id) => ctx.toggleStar(id)}
                  />
                </div>

                {/* Pagination */}
                <Pagination
                  page={pageIndex + 1}
                  hasPrev={hasPrev}
                  hasNext={hasNext}
                  onPrev={() => { setPageIndex((p) => p - 1); setSelectedEmail(null); }}
                  onNext={() => { setPageIndex((p) => p + 1); setSelectedEmail(null); }}
                  loading={false}
                />
              </div>

              {/* Resize handle */}
              {hasDetail && (
                <div
                  onMouseDown={handleDragStart}
                  className="hidden md:flex w-1.5 shrink-0 cursor-col-resize hover:bg-primary/10 active:bg-primary/20 transition-colors duration-150 items-center justify-center group z-30"
                  title="Drag to resize"
                >
                  <div className="w-px h-8 rounded-full bg-border/70 group-hover:bg-primary/50 transition-colors" />
                </div>
              )}

              {/* Email Detail Pane */}
              {hasDetail && (
                <div className="flex-1 min-w-0 overflow-hidden flex flex-col">
                  <div className="md:hidden flex items-center gap-2 px-4 py-2.5 border-b border-border/40 shrink-0 bg-card/60">
                    <button
                      onClick={() => setSelectedEmail(null)}
                      className="flex items-center gap-1.5 text-[13px] font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    >
                      ← Back to inbox
                    </button>
                  </div>
                  <EmailDetail
                    email={selectedEmail}
                    onClose={() => setSelectedEmail(null)}
                    onDelete={handleEmailDeleted}
                    onArchive={handleArchiveEmail}
                    replyKey={replyKey}
                    onAnalyzed={(emailId, priority) =>
                      setEmailPriorities((prev) => ({ ...prev, [emailId]: priority }))
                    }
                    isDemo
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Compose */}
      {showCompose && <ComposeModal onClose={() => setShowCompose(false)} isDemo />}

      {/* Settings */}
      <SettingsOverlay
        user={ctx.user}
        gmailConnected={false}
        calendarConnected={false}
      />

      {/* Keyboard Shortcuts */}
      <KeyboardShortcutsModal
        open={showShortcuts}
        onClose={() => setShowShortcuts(false)}
      />

      {/* Sign-in modal */}
      <DemoSignInModal />

      {/* Drag overlay */}
      {dragging && (
        <div className="fixed inset-0 z-50 cursor-col-resize bg-transparent" />
      )}
    </div>
  );
}

"use client";

import { authClient } from "@/lib/auth-client";
import { useEffect, useState } from "react";
import ComposeModal from "@/components/email/ComposeModal";
import DraftEditPanel from "@/components/email/DraftEditPanel";
import DraftRow from "@/components/email/DraftRow";
import Pagination from "@/components/email/Pagination";
import Sidebar from "@/components/layout/Sidebar";
import TopNav from "@/components/layout/TopNav";
import SettingsOverlay from "@/components/layout/SettingsOverlay";
import { decodeEmailBody } from "@/lib/email";
import type { Draft, SelectedDraft } from "@/types/email";

export default function DraftsContent({
  gmailConnected,
  calendarConnected,
}: {
  gmailConnected: boolean;
  calendarConnected: boolean;
}) {
  const { data: session } = authClient.useSession();

  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [tokenHistory, setTokenHistory] = useState<string[]>([""]);
  const [pageIndex, setPageIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedDraft, setSelectedDraft] = useState<SelectedDraft | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [showCompose, setShowCompose] = useState(false);

  const fetchPage = async (token: string) => {
    setLoading(true);
    setError(null);
    try {
      const qs = token ? `?pageToken=${encodeURIComponent(token)}` : "";
      const res = await fetch(`/api/drafts${qs}`);
      const data = await res.json();
      setDrafts(data.drafts ?? []);
      setNextPageToken(data.nextPageToken ?? null);
    } catch {
      setError("Failed to load drafts.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPage("");
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const goToNext = () => {
    if (!nextPageToken) return;
    const newIndex = pageIndex + 1;
    if (newIndex >= tokenHistory.length) {
      setTokenHistory((prev) => [...prev, nextPageToken]);
    }
    setPageIndex(newIndex);
    setSelectedDraft(null);
    fetchPage(nextPageToken);
  };

  const goToPrev = () => {
    if (pageIndex === 0) return;
    const newIndex = pageIndex - 1;
    setPageIndex(newIndex);
    setSelectedDraft(null);
    fetchPage(tokenHistory[newIndex]);
  };

  const handleSelectDraft = async (draft: Draft) => {
    if (selectedDraft?.id === draft.id) { setSelectedDraft(null); return; }
    setDetailLoading(true);
    setSelectedDraft(null);
    try {
      const res = await fetch(`/api/drafts/${draft.id}`);
      const data = await res.json();
      const msg = data.draft?.message;
      const findHeader = (name: string) =>
        msg?.payload?.headers?.find((h: any) => h.name === name)?.value ?? "";
      const { content: body } = decodeEmailBody(msg);
      setSelectedDraft({
        id: draft.id,
        to: findHeader("To"),
        subject: findHeader("Subject"),
        body,
      });
    } finally {
      setDetailLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/drafts/${id}`, { method: "DELETE" });
    setDrafts((prev) => prev.filter((d) => d.id !== id));
    if (selectedDraft?.id === id) setSelectedDraft(null);
  };

  const handleSent = (id: string) => {
    setDrafts((prev) => prev.filter((d) => d.id !== id));
    setSelectedDraft(null);
  };

  const hasDetail = selectedDraft !== null || detailLoading;

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar
        user={session?.user}
        onCompose={() => setShowCompose(true)}
        gmailConnected={gmailConnected}
        calendarConnected={calendarConnected}
      />

      {/* Main Workspace Frame */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Top Navigation */}
        <TopNav
          user={session?.user}
          gmailConnected={gmailConnected}
        />

        {/* Card outer container */}
        <div className="flex-1 flex overflow-hidden p-4 pt-0 gap-4">
          
          {/* Draft list pane */}
          <div
            className={`flex flex-col bg-card border border-border/40 rounded-xl overflow-hidden shadow-xl ${
              hasDetail ? "w-[42%]" : "flex-1"
            }`}
          >
            {/* Header */}
            <div className="px-5 py-3 border-b border-border/40 shrink-0 flex items-center justify-between bg-card/60 backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-serif text-foreground tracking-tight leading-none">Drafts</h1>
                {drafts.length > 0 && (
                  <span className="text-[10px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded font-mono">
                    {drafts.length}
                  </span>
                )}
              </div>
            </div>

            {/* Draft list */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="divide-y divide-border/20">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3 px-4 py-4 bg-card animate-pulse">
                      <div className="h-4 w-10 bg-secondary/80 rounded" />
                      <div className="h-3 flex-1 bg-secondary/80 rounded" />
                    </div>
                  ))}
                </div>
              ) : error ? (
                <div className="p-8 text-center text-destructive text-xs font-medium">{error}</div>
              ) : drafts.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full py-20 gap-3 text-muted-foreground bg-card">
                  <p className="text-xs font-medium">No drafts saved</p>
                  <button
                    onClick={() => setShowCompose(true)}
                    className="text-xs text-foreground font-semibold hover:opacity-85 cursor-pointer"
                  >
                    + Compose a new message
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-border/25">
                  {drafts.map((draft) => (
                    <DraftRow
                      key={draft.id}
                      draft={draft}
                      selected={selectedDraft?.id === draft.id}
                      onClick={() => handleSelectDraft(draft)}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Pagination */}
            {!loading && !error && (
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

          {/* Edit pane */}
          {hasDetail && (
            <div className="flex-1 bg-card border border-border/40 rounded-xl overflow-hidden shadow-xl flex flex-col min-w-0">
              {detailLoading ? (
                <div className="p-6 space-y-4 flex-1">
                  <div className="h-5 bg-secondary animate-pulse w-64 rounded-lg" />
                  <div className="flex gap-3">
                    <div className="size-9 rounded-full bg-secondary animate-pulse shrink-0" />
                    <div className="flex-1 space-y-2.5">
                      <div className="h-3.5 bg-secondary animate-pulse w-32 rounded" />
                      <div className="h-3 bg-secondary animate-pulse w-48 rounded" />
                    </div>
                  </div>
                </div>
              ) : selectedDraft ? (
                <DraftEditPanel
                  key={selectedDraft.id}
                  draftId={selectedDraft.id}
                  initialTo={selectedDraft.to}
                  initialSubject={selectedDraft.subject}
                  initialBody={selectedDraft.body}
                  onClose={() => setSelectedDraft(null)}
                  onSent={() => handleSent(selectedDraft.id)}
                />
              ) : null}
            </div>
          )}
        </div>
      </div>

      {showCompose && <ComposeModal onClose={() => setShowCompose(false)} />}
      <SettingsOverlay
        user={session?.user}
        gmailConnected={gmailConnected}
        calendarConnected={calendarConnected}
      />
    </div>
  );
}

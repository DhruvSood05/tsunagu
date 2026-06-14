"use client";

import { authClient } from "@/lib/auth-client";
import { useEffect, useState } from "react";
import ComposeModal from "@/components/dashboard/ComposeModal";
import DraftEditPanel from "@/components/dashboard/DraftEditPanel";
import DraftRow from "@/components/dashboard/DraftRow";
import Pagination from "@/components/dashboard/Pagination";
import Sidebar from "@/components/dashboard/Sidebar";
import { decodeEmailBody } from "@/lib/email";

interface Draft {
  id: string;
  message?: { id: string; threadId?: string };
}

interface SelectedDraft {
  id: string;
  to: string;
  subject: string;
  body: string;
}

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
    <div className="flex h-screen overflow-hidden">
      <Sidebar user={session?.user} onCompose={() => setShowCompose(true)} gmailConnected={gmailConnected} calendarConnected={calendarConnected} />

      {/* Draft list pane */}
      <div
        className={`flex flex-col border-r overflow-hidden ${
          hasDetail ? "w-[45%]" : "flex-1"
        }`}
      >
        {/* Header */}
        <div className="px-4 py-2.5 border-b shrink-0 flex items-center gap-2">
          <h1 className="text-xs font-semibold text-foreground">Drafts</h1>
          {drafts.length > 0 && (
            <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-sm">
              {drafts.length}
            </span>
          )}
        </div>

        {/* Draft list */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="space-y-0">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3 border-b border-border/60">
                  <div className="h-4 w-10 bg-muted animate-pulse rounded-sm" />
                  <div className="h-3 flex-1 bg-muted animate-pulse rounded" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="p-8 text-center text-destructive text-xs">{error}</div>
          ) : drafts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
              <p className="text-sm font-medium">No drafts saved</p>
              <button
                onClick={() => setShowCompose(true)}
                className="text-xs text-primary hover:underline"
              >
                + Compose a new message
              </button>
            </div>
          ) : (
            <div>
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
        <div className="flex-1 overflow-hidden border-l">
          {detailLoading ? (
            <div className="p-6 space-y-4">
              <div className="h-5 bg-muted animate-pulse w-64 rounded" />
              <div className="flex gap-3">
                <div className="size-8 rounded-full bg-muted animate-pulse shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-muted animate-pulse w-32 rounded" />
                  <div className="h-2.5 bg-muted animate-pulse w-48 rounded" />
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

      {showCompose && <ComposeModal onClose={() => setShowCompose(false)} />}
    </div>
  );
}

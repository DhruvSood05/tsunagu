"use client";

import { useState } from "react";
import ComposeModal from "@/components/email/ComposeModal";
import DraftRow from "@/components/email/DraftRow";
import Pagination from "@/components/email/Pagination";
import Sidebar from "@/components/layout/Sidebar";
import TopNav from "@/components/layout/TopNav";
import SettingsOverlay from "@/components/layout/SettingsOverlay";
import DemoBanner from "@/app/demo/DemoBanner";
import DemoSignInModal from "@/app/demo/DemoSignInModal";
import { useDemoContext, type DemoDraft } from "@/lib/demo/DemoContext";

export default function DemoDraftsContent() {
  const ctx = useDemoContext();
  const [showCompose, setShowCompose] = useState(false);
  const [editingDraft, setEditingDraft] = useState<DemoDraft | null>(null);

  const openEdit = (draft: DemoDraft) => {
    setEditingDraft(draft);
    setShowCompose(true);
  };

  const closeCompose = () => {
    setShowCompose(false);
    setEditingDraft(null);
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      <DemoBanner />

      <div className="flex flex-1 overflow-hidden min-h-0">
        <Sidebar
          user={ctx.user}
          onCompose={() => { setEditingDraft(null); setShowCompose(true); }}
          gmailConnected={true}
          calendarConnected={true}
          basePath="/demo"
        />

        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          <TopNav
            user={ctx.user}
            gmailConnected={true}
            basePath="/demo"
            onOpenPalette={() => ctx.setShowSignInModal(true)}
          />

          <div className="flex-1 flex overflow-hidden p-2 md:p-4 pt-0">
            <div className="flex flex-col bg-card border border-border/40 rounded-xl overflow-hidden shadow-xl flex-1">
              {/* Header */}
              <div className="px-5 py-3.5 border-b border-border/40 shrink-0 flex items-center justify-between bg-card/60 backdrop-blur-sm">
                <h1 className="text-lg font-semibold text-foreground tracking-tight leading-none">Drafts</h1>
                {ctx.drafts.length > 0 && (
                  <span className="text-xs text-muted-foreground">{ctx.drafts.length} draft{ctx.drafts.length > 1 ? "s" : ""}</span>
                )}
              </div>

              {/* Draft list or empty state */}
              <div className="flex-1 overflow-y-auto">
                {ctx.drafts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground h-full">
                    <p className="text-[14px] font-medium font-heading text-foreground tracking-tight">No drafts saved</p>
                    <p className="text-[12px] text-muted-foreground">Drafts you compose will appear here.</p>
                    <button
                      onClick={() => { setEditingDraft(null); setShowCompose(true); }}
                      className="mt-1 text-xs text-foreground font-semibold hover:opacity-85 cursor-pointer"
                    >
                      + Compose a new message
                    </button>
                  </div>
                ) : (
                  ctx.drafts.map((draft) => (
                    <DraftRow
                      key={draft.id}
                      draft={draft}
                      selected={false}
                      onClick={() => openEdit(draft)}
                      onDelete={(id) => ctx.deleteDraft(id)}
                    />
                  ))
                )}
              </div>

              <Pagination page={1} hasPrev={false} hasNext={false} onPrev={() => {}} onNext={() => {}} loading={false} />
            </div>
          </div>
        </div>
      </div>

      {showCompose && (
        <ComposeModal
          onClose={closeCompose}
          isDemo
          initialTo={editingDraft?.to ?? ""}
          initialSubject={editingDraft?.subject ?? ""}
          initialBody={editingDraft?.body ?? ""}
          editDraftId={editingDraft?.id}
          onSaveDraft={ctx.saveDraft}
          onUpdateDraft={ctx.updateDraft}
        />
      )}

      <SettingsOverlay user={ctx.user} gmailConnected={false} calendarConnected={false} />
      <DemoSignInModal />
    </div>
  );
}

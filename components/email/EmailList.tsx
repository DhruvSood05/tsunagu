"use client";

import { useState } from "react";
import EmailRow from "./EmailRow";
import { Skeleton } from "@/components/ui/skeleton";
import { RiInboxLine, RiSearchLine, RiDeleteBinLine } from "@remixicon/react";

interface EmailListProps {
  emails: any[];
  selectedId?: string;
  onSelect: (email: any) => void;
  isSearchMode?: boolean;
  searchQuery?: string;
  loading?: boolean;
  onBulkDelete?: (ids: string[]) => void;
  emailPriorities?: Record<string, string>;
}

export function EmailListSkeleton() {
  return (
    <div className="divide-y divide-border/20 font-sans">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-start gap-3 px-4 py-4.5 bg-card">
          <div className="pt-1 shrink-0">
            <Skeleton className="size-3.5 rounded bg-secondary/80 animate-pulse" />
          </div>
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex justify-between gap-4">
              <Skeleton className="h-3.5 w-28 bg-secondary/80 animate-pulse rounded" />
              <Skeleton className="h-3 w-10 bg-secondary/60 animate-pulse rounded" />
            </div>
            <Skeleton className="h-3 w-40 bg-secondary/80 animate-pulse rounded" />
            <Skeleton className="h-2.5 w-full bg-secondary/40 animate-pulse rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function EmailList({
  emails,
  selectedId,
  onSelect,
  isSearchMode,
  searchQuery,
  loading,
  onBulkDelete,
  emailPriorities,
}: EmailListProps) {
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const toggleCheck = (id: string, checked: boolean) => {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const handleBulkDelete = async () => {
    const ids = Array.from(checkedIds);
    setBulkDeleting(true);
    await Promise.all(ids.map((id) => fetch(`/api/emails/${id}`, { method: "DELETE" })));
    onBulkDelete?.(ids);
    setCheckedIds(new Set());
    setBulkDeleting(false);
  };

  if (loading) return <EmailListSkeleton />;

  if (!emails.length) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-20 gap-3 text-muted-foreground/80 font-sans select-none">
        {isSearchMode ? (
          <>
            <RiSearchLine className="size-8 opacity-20" />
            <div className="text-center space-y-1">
              <p className="text-lg font-semibold text-foreground tracking-tight">No results found</p>
              <p className="text-xs text-muted-foreground/80">No emails match &quot;{searchQuery}&quot;</p>
            </div>
          </>
        ) : (
          <>
            <RiInboxLine className="size-8 opacity-20" />
            <div className="text-center space-y-1">
              <p className="text-lg font-semibold text-foreground tracking-tight">Your inbox is empty</p>
              <p className="text-xs text-muted-foreground/80">Connect Gmail using the sidebar link</p>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="divide-y divide-border/20">
      {/* Bulk action bar — appears when rows are checked */}
      {checkedIds.size > 0 && (
        <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-2.5 bg-card/95 backdrop-blur-sm border-b border-border/40 shadow-sm animate-in slide-in-from-top-1 duration-150">
          <span className="text-xs font-semibold text-foreground">
            {checkedIds.size} selected
          </span>
          <button
            onClick={handleBulkDelete}
            disabled={bulkDeleting}
            className="flex items-center gap-1.5 text-xs font-semibold text-rose-500 hover:text-rose-400 disabled:opacity-50 transition-colors cursor-pointer"
          >
            <RiDeleteBinLine className="size-3.5" />
            {bulkDeleting ? "Deleting…" : `Delete ${checkedIds.size}`}
          </button>
        </div>
      )}
      {emails.map((email) => (
        <EmailRow
          key={email.id}
          email={email}
          selected={email.id === selectedId}
          checked={checkedIds.has(email.id)}
          priority={emailPriorities?.[email.id] as any ?? null}
          onClick={() => onSelect(email)}
          onCheck={(checked) => toggleCheck(email.id, checked)}
        />
      ))}
    </div>
  );
}

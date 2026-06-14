"use client";

import { useState } from "react";
import EmailRow from "./EmailRow";
import { Skeleton } from "@/components/ui/skeleton";
import { RiInboxLine, RiSearchLine } from "@remixicon/react";

interface EmailListProps {
  emails: any[];
  selectedId?: string;
  onSelect: (email: any) => void;
  isSearchMode?: boolean;
  searchQuery?: string;
  loading?: boolean;
}

export function EmailListSkeleton() {
  return (
    <div>
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex items-start gap-2.5 px-3 py-3 border-b border-border/60">
          <div className="flex items-center justify-center pt-1 shrink-0">
            <Skeleton className="size-3.5 rounded-sm" />
          </div>
          <div className="flex-1 min-w-0 space-y-1.5">
            <div className="flex justify-between gap-2">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-3 w-10" />
            </div>
            <Skeleton className="h-3 w-48" />
            <Skeleton className="h-2.5 w-full" />
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
}: EmailListProps) {
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());

  const toggleCheck = (id: string, checked: boolean) => {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  if (loading) return <EmailListSkeleton />;

  if (!emails.length) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-20 gap-3 text-muted-foreground">
        {isSearchMode ? (
          <>
            <RiSearchLine className="size-8 opacity-30" />
            <div className="text-center space-y-1">
              <p className="text-sm font-medium">No results found</p>
              <p className="text-xs">No emails match &quot;{searchQuery}&quot;</p>
            </div>
          </>
        ) : (
          <>
            <RiInboxLine className="size-8 opacity-30" />
            <div className="text-center space-y-1">
              <p className="text-sm font-medium">Your inbox is empty</p>
              <p className="text-xs">Connect Gmail using the sidebar link</p>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div>
      {emails.map((email) => (
        <EmailRow
          key={email.id}
          email={email}
          selected={email.id === selectedId}
          checked={checkedIds.has(email.id)}
          onClick={() => onSelect(email)}
          onCheck={(checked) => toggleCheck(email.id, checked)}
        />
      ))}
    </div>
  );
}

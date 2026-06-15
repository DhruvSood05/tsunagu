"use client";

import { useState } from "react";

interface UsePaginationReturn {
  pageIndex: number;
  tokenHistory: string[];
  currentToken: string;
  hasPrev: boolean;
  goToNext: (nextToken: string) => void;
  goToPrev: () => void;
  reset: () => void;
  onNextToken: string | null;
  setNextToken: (token: string | null) => void;
}

export function usePagination(): UsePaginationReturn {
  const [tokenHistory, setTokenHistory] = useState<string[]>([""]);
  const [pageIndex, setPageIndex] = useState(0);
  const [nextToken, setNextToken] = useState<string | null>(null);

  const goToNext = (token: string) => {
    const newIndex = pageIndex + 1;
    if (newIndex >= tokenHistory.length) {
      setTokenHistory((prev) => [...prev, token]);
    }
    setPageIndex(newIndex);
  };

  const goToPrev = () => {
    if (pageIndex === 0) return;
    setPageIndex((i) => i - 1);
  };

  const reset = () => {
    setTokenHistory([""]);
    setPageIndex(0);
    setNextToken(null);
  };

  return {
    pageIndex,
    tokenHistory,
    currentToken: tokenHistory[pageIndex],
    hasPrev: pageIndex > 0,
    goToNext,
    goToPrev,
    reset,
    onNextToken: nextToken,
    setNextToken,
  };
}

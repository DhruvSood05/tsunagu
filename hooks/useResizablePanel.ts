"use client";

import { useRef, useState } from "react";

interface UseResizablePanelOptions {
  defaultWidth: number;
  min?: number;
  max?: number;
  /** Direction: "left" shrinks from the left (calendar panel), "right" grows right (inbox detail) */
  direction?: "left" | "right";
}

export function useResizablePanel({
  defaultWidth,
  min = 280,
  max = 560,
  direction = "left",
}: UseResizablePanelOptions) {
  const [width, setWidth] = useState(defaultWidth);
  const startX = useRef(0);
  const startW = useRef(defaultWidth);

  const onDividerMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    startX.current = e.clientX;
    startW.current = width;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    const onMove = (ev: MouseEvent) => {
      const delta = ev.clientX - startX.current;
      const next = direction === "left"
        ? startW.current - delta
        : startW.current + delta;
      setWidth(Math.max(min, Math.min(max, next)));
    };

    const onUp = () => {
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  return { width, onDividerMouseDown };
}

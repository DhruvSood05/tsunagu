"use client";

import { useEffect } from "react";
import { RiCloseLine, RiKeyboardLine } from "@remixicon/react";

interface KeyboardShortcutsModalProps {
  open: boolean;
  onClose: () => void;
}

const SHORTCUT_GROUPS = [
  {
    label: "Navigation",
    shortcuts: [
      { keys: ["Alt", "A"], description: "Open AI Assistant from anywhere" },
      { keys: ["Cmd/Ctrl", "K"], description: "Open command palette / search" },
      { keys: ["?"], description: "Show keyboard shortcuts" },
    ],
  },
  {
    label: "Email",
    shortcuts: [
      { keys: ["J"], description: "Next email" },
      { keys: ["K"], description: "Previous email" },
      { keys: ["C"], description: "Compose new message" },
      { keys: ["R"], description: "Reply to selected email" },
      { keys: ["E"], description: "Archive selected email" },
      { keys: ["Esc"], description: "Close email panel" },
    ],
  },
  {
    label: "AI Chat",
    shortcuts: [
      { keys: ["Enter"], description: "Send message" },
      { keys: ["Shift", "Enter"], description: "New line in message" },
    ],
  },
];

function Kbd({ children }: { children: string }) {
  return (
    <span className="inline-flex items-center justify-center min-w-[28px] h-6 px-1.5 rounded border border-border/60 bg-secondary/80 text-[10px] font-bold font-mono text-foreground shadow-sm">
      {children}
    </span>
  );
}

export default function KeyboardShortcutsModal({ open, onClose }: KeyboardShortcutsModalProps) {
  useEffect(() => {
    if (!open) return;
    const handle = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center font-sans">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-card border border-border/60 rounded-xl shadow-2xl z-10 overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/40 bg-card/80 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <RiKeyboardLine className="size-4 text-muted-foreground" />
            <h2 className="text-xs font-bold text-foreground uppercase tracking-widest">Keyboard Shortcuts</h2>
          </div>
          <button
            onClick={onClose}
            className="size-7 flex items-center justify-center rounded-md text-muted-foreground/50 hover:text-foreground hover:bg-secondary/80 transition-all cursor-pointer"
          >
            <RiCloseLine className="size-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5 max-h-[60vh] overflow-y-auto">
          {SHORTCUT_GROUPS.map((group) => (
            <div key={group.label} className="space-y-2">
              <p className="text-[9px] font-bold text-muted-foreground/50 uppercase tracking-widest">{group.label}</p>
              <div className="space-y-1.5">
                {group.shortcuts.map((s, i) => (
                  <div key={i} className="flex items-center justify-between gap-4 py-1.5 px-3 rounded-md hover:bg-secondary/30 transition-colors">
                    <span className="text-xs text-muted-foreground">{s.description}</span>
                    <div className="flex items-center gap-1 shrink-0">
                      {s.keys.map((k, j) => (
                        <span key={j} className="flex items-center gap-1">
                          <Kbd>{k}</Kbd>
                          {j < s.keys.length - 1 && <span className="text-[10px] text-muted-foreground/40">+</span>}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-border/40 bg-secondary/10 flex items-center justify-between">
          <p className="text-[10px] text-muted-foreground/50">Press <Kbd>?</Kbd> anytime to reopen</p>
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-[10px] font-semibold text-muted-foreground hover:text-foreground bg-secondary/40 hover:bg-secondary/80 border border-border/30 rounded-md transition-all cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

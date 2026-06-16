"use client";

import { RiAlertLine, RiRefreshLine } from "@remixicon/react";

interface ReconnectBannerProps {
  plugin: "gmail" | "googlecalendar";
}

const LABELS = {
  gmail: { name: "Gmail", connectPath: "/api/connect?plugin=gmail" },
  googlecalendar: { name: "Google Calendar", connectPath: "/api/connect?plugin=googlecalendar" },
};

export default function ReconnectBanner({ plugin }: ReconnectBannerProps) {
  const { name, connectPath } = LABELS[plugin];

  return (
    <div className="mx-4 mt-3 flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-amber-500/8 border border-amber-500/20 text-amber-600 dark:text-amber-400">
      <div className="flex items-center gap-2.5 min-w-0">
        <RiAlertLine className="size-4 shrink-0" />
        <p className="text-xs font-medium truncate">
          Your {name} connection expired. Reconnect to load your data.
        </p>
      </div>
      <button
        onClick={() => { window.location.href = connectPath; }}
        className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/25 transition-all shrink-0 cursor-pointer"
      >
        <RiRefreshLine className="size-3" />
        Reconnect
      </button>
    </div>
  );
}

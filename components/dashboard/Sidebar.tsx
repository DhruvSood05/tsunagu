"use client";

import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  RiCalendarLine,
  RiDraftLine,
  RiGoogleFill,
  RiInboxLine,
  RiLogoutBoxLine,
} from "@remixicon/react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

interface SidebarProps {
  user?: { name?: string | null; email?: string | null; image?: string | null } | null;
  onCompose?: () => void;
  gmailConnected?: boolean;
  calendarConnected?: boolean;
}

function UserAvatar({
  name,
  email,
  image,
}: {
  name?: string | null;
  email?: string | null;
  image?: string | null;
}) {
  const [imgError, setImgError] = useState(false);

  const initials = name
    ? name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : email?.[0]?.toUpperCase() ?? "?";

  if (image && !imgError) {
    return (
      <img
        src={image}
        alt={name ?? email ?? "User"}
        referrerPolicy="no-referrer"
        onError={() => setImgError(true)}
        className="size-8 rounded-full object-cover shrink-0"
      />
    );
  }

  return (
    <div className="size-8 rounded-full bg-primary flex items-center justify-center shrink-0">
      <span className="text-xs font-semibold text-primary-foreground leading-none">
        {initials}
      </span>
    </div>
  );
}

function ConnectionToggle({
  label,
  icon: Icon,
  connected,
  onConnect,
  onDisconnect,
}: {
  label: string;
  icon: React.ElementType;
  connected: boolean;
  onConnect: () => void;
  onDisconnect: () => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);

  const handleToggle = async () => {
    if (busy) return;
    if (!connected) { onConnect(); return; }
    setBusy(true);
    try { await onDisconnect(); } finally { setBusy(false); }
  };

  return (
    <div className="flex items-center justify-between px-3 py-1.5 rounded-sm">
      <div className="flex items-center gap-2">
        <Icon className="size-4 text-muted-foreground shrink-0" />
        <span className="text-sm text-muted-foreground">{label}</span>
        <span
          className={`size-1.5 rounded-full shrink-0 ${
            connected ? "bg-green-500" : "bg-muted-foreground/30"
          }`}
        />
      </div>
      <button
        onClick={handleToggle}
        disabled={busy}
        title={connected ? `Disconnect ${label}` : `Connect ${label}`}
        className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border-2 border-transparent transition-colors disabled:opacity-50 focus:outline-none ${
          connected ? "bg-primary" : "bg-input"
        }`}
      >
        <span
          className={`pointer-events-none inline-block size-3.5 rounded-full bg-background shadow-sm transition-transform ${
            connected ? "translate-x-4" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  );
}

export default function Sidebar({
  user,
  onCompose,
  gmailConnected = false,
  calendarConnected = false,
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = async () => {
    await authClient.signOut();
    router.push("/");
  };

  const navItems = [
    { href: "/dashboard", label: "Inbox", icon: RiInboxLine },
    { href: "/dashboard/drafts", label: "Drafts", icon: RiDraftLine },
    { href: "/dashboard/calendar", label: "Calendar", icon: RiCalendarLine },
  ];

  return (
    <aside className="w-56 shrink-0 border-r flex flex-col bg-sidebar h-full">
      {/* User */}
      <div className="flex items-center gap-3 px-4 py-4 border-b">
        <UserAvatar name={user?.name} email={user?.email} image={user?.image} />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium truncate text-foreground">
            {user?.name ?? user?.email}
          </p>
          <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
        </div>
      </div>

      {/* Compose */}
      <div className="px-3 py-3">
        <Button
          onClick={onCompose}
          className="w-full justify-start gap-2"
          size="sm"
        >
          <RiDraftLine className="size-3.5" />
          Compose
        </Button>
      </div>

      <Separator />

      {/* Nav */}
      <nav className="flex-1 px-2 py-2 space-y-0.5">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2.5 px-3 py-2 text-sm rounded-sm transition-colors ${
                active
                  ? "bg-primary text-primary-foreground font-medium"
                  : "text-foreground hover:bg-muted"
              }`}
            >
              <Icon className="size-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      <Separator />

      {/* Footer */}
      <div className="px-3 py-3 space-y-1">
        <ConnectionToggle
          label="Gmail"
          icon={RiGoogleFill}
          connected={gmailConnected}
          onConnect={() => { window.location.href = "/api/connect?plugin=gmail"; }}
          onDisconnect={async () => {
            const res = await fetch("/api/gmail/disconnect", { method: "POST" });
            if (res.ok) { router.push("/dashboard"); router.refresh(); }
          }}
        />
        <ConnectionToggle
          label="Calendar"
          icon={RiCalendarLine}
          connected={calendarConnected}
          onConnect={() => { window.location.href = "/api/connect?plugin=googlecalendar"; }}
          onDisconnect={async () => {
            const res = await fetch("/api/calendar/disconnect", { method: "POST" });
            if (res.ok) { router.push("/dashboard"); router.refresh(); }
          }}
        />
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 w-full px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-sm hover:bg-muted"
        >
          <RiLogoutBoxLine className="size-4 shrink-0" />
          Sign out
        </button>
      </div>
    </aside>
  );
}

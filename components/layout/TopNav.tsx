"use client";

import { authClient } from "@/lib/auth-client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  RiMailLine,
  RiArrowUpDownLine,
  RiSearchLine,
  RiLogoutBoxLine,
  RiSettings4Line,
  RiGoogleFill,
  RiUser3Line
} from "@remixicon/react";
import NotificationBell from "@/components/notifications/NotificationBell";

interface TopNavProps {
  user?: { name?: string | null; email?: string | null; image?: string | null } | null;
  onOpenPalette?: () => void;
  gmailConnected?: boolean;
}

export default function TopNav({ user, onOpenPalette, gmailConnected = false }: TopNavProps) {
  const router = useRouter();
  const [workspaceOpen, setWorkspaceOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const workspaceRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (workspaceRef.current && !workspaceRef.current.contains(event.target as Node)) {
        setWorkspaceOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    await authClient.signOut();
    router.push("/");
  };

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : user?.email?.[0]?.toUpperCase() ?? "?";

  return (
    <header className="h-16 border-b border-border/40 bg-background/80 backdrop-blur-md flex items-center justify-between px-6 shrink-0 z-40 select-none font-sans">
      {/* Left: Workspace Switcher */}
      <div ref={workspaceRef} className="relative">
        <button
          onClick={() => setWorkspaceOpen(!workspaceOpen)}
          className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-secondary/80 border border-transparent hover:border-border/40 transition-all duration-150 active:scale-[0.98] cursor-pointer"
        >
          <div className="size-5 rounded-md bg-foreground/5 flex items-center justify-center shrink-0">
            <RiMailLine className="size-3.5 text-foreground" />
          </div>
          <div className="text-left">
            <p className="text-[13px] font-semibold tracking-tight text-foreground leading-none">
              {user?.name ? `${user.name}'s Space` : "My Workspace"}
            </p>
          </div>
          <RiArrowUpDownLine className="size-3.5 text-muted-foreground ml-1" />
        </button>

        {workspaceOpen && (
          <div className="absolute left-0 mt-2 w-56 rounded-lg border border-border bg-card p-1.5 shadow-xl animate-in fade-in-50 slide-in-from-top-2 duration-150 z-50">
            <div className="px-2.5 py-1.5 text-[9px] font-bold text-muted-foreground/60 uppercase tracking-widest font-heading">
              Workspaces
            </div>
            <button className="flex items-center gap-2.5 w-full px-2 py-2 rounded-md bg-secondary/80 text-left">
              <div className="size-5 rounded-md bg-foreground/10 flex items-center justify-center text-[10px] font-bold font-heading">
                T
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-foreground truncate">Primary Workspace</p>
                <p className="text-[10px] text-muted-foreground truncate">{user?.email}</p>
              </div>
              <span className="size-1.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
            </button>
            <div className="my-1 border-t border-border/40" />
            <div className="px-2 py-1.5 flex items-center justify-between text-[10px] text-muted-foreground">
              <span>Gmail Status</span>
              <span className={`inline-flex items-center gap-1 font-semibold ${gmailConnected ? "text-emerald-500" : "text-amber-500"}`}>
                <RiGoogleFill className="size-3" />
                {gmailConnected ? "Connected" : "Disconnected"}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Center: Command Palette Trigger */}
      <div className="flex-1 max-w-md mx-6">
        <button
          onClick={onOpenPalette}
          className="w-full h-9 flex items-center justify-between px-3.5 rounded-lg bg-secondary/50 hover:bg-secondary/80 border border-border/40 hover:border-border transition-all duration-150 text-muted-foreground hover:text-foreground text-xs cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <RiSearchLine className="size-4 text-muted-foreground/60" />
            <span className="font-medium">Search workspace…</span>
          </div>
          <div className="flex items-center gap-0.5">
            <kbd className="h-5 px-1.5 rounded bg-background border border-border/60 font-mono text-[9px] font-semibold text-muted-foreground/60 flex items-center shadow-sm">
              ⌘
            </kbd>
            <kbd className="h-5 px-1.5 rounded bg-background border border-border/60 font-mono text-[9px] font-semibold text-muted-foreground/60 flex items-center shadow-sm">
              K
            </kbd>
          </div>
        </button>
      </div>

      {/* Right: Notification & Profile */}
      <div className="flex items-center gap-3">
        {/* Notifications */}
        <NotificationBell />

        {/* Profile Dropdown */}
        <div ref={profileRef} className="relative">
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="size-8 rounded-full border border-border/40 overflow-hidden hover:opacity-90 active:scale-95 transition-all duration-150 shadow-md shrink-0 flex items-center justify-center cursor-pointer"
          >
            {user?.image ? (
              <img
                src={user.image}
                alt={user.name ?? "User"}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-full h-full bg-secondary flex items-center justify-center">
                <span className="text-xs font-semibold text-foreground leading-none">{initials}</span>
              </div>
            )}
          </button>

          {profileOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-lg border border-border bg-card p-1.5 shadow-xl animate-in fade-in-50 slide-in-from-top-2 duration-150 z-50">
              <div className="px-2.5 py-2">
                <p className="text-xs font-bold text-foreground leading-tight truncate">{user?.name ?? "User"}</p>
                <p className="text-[10px] text-muted-foreground truncate mt-0.5">{user?.email}</p>
              </div>
              <div className="my-1 border-t border-border/40" />
              <button
                onClick={() => { setProfileOpen(false); router.push("/dashboard/ai"); }}
                className="flex items-center gap-2 w-full px-2.5 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors rounded-md cursor-pointer"
              >
                <RiUser3Line className="size-4 shrink-0" />
                AI Assistant
              </button>
              <button
                onClick={() => { setProfileOpen(false); router.push("/dashboard/calendar"); }}
                className="flex items-center gap-2 w-full px-2.5 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors rounded-md cursor-pointer"
              >
                <RiSettings4Line className="size-4 shrink-0" />
                Calendar Settings
              </button>
              <div className="my-1 border-t border-border/40" />
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 w-full px-2.5 py-2 text-xs text-destructive hover:bg-destructive/10 transition-all rounded-md cursor-pointer"
              >
                <RiLogoutBoxLine className="size-4 shrink-0" />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

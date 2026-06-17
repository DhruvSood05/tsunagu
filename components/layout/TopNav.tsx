"use client";

import { authClient } from "@/lib/auth-client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Mail,
  ChevronsUpDown,
  Search,
  LogOut,
  Menu,
} from "lucide-react";
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
    <header className="h-14 border-b border-border/40 bg-background/80 backdrop-blur-md flex items-center justify-between px-4 md:px-5 shrink-0 z-40 select-none font-sans">
      {/* Left: Hamburger (mobile) + Workspace Switcher */}
      <div className="flex items-center gap-1.5">
        {/* Hamburger — mobile only */}
        <button
          className="md:hidden size-8 flex items-center justify-center rounded-lg text-foreground/60 hover:text-foreground hover:bg-secondary/80 transition-all cursor-pointer"
          onClick={() => window.dispatchEvent(new Event("toggle-mobile-sidebar"))}
          aria-label="Open menu"
        >
          <Menu className="size-5" strokeWidth={1.75} />
        </button>

      <div ref={workspaceRef} className="relative">
        <button
          onClick={() => setWorkspaceOpen(!workspaceOpen)}
          className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-secondary/80 border border-transparent hover:border-border/40 transition-all duration-150 active:scale-[0.98] cursor-pointer"
        >
          <div className="size-5 rounded-md bg-foreground/5 flex items-center justify-center shrink-0">
            <Mail className="size-3.5 text-foreground" strokeWidth={1.75} />
          </div>
          <div className="text-left">
            <p className="text-[13px] font-semibold tracking-tight text-foreground leading-none">
              {user?.name ? `${user.name}'s Space` : "My Workspace"}
            </p>
          </div>
          <ChevronsUpDown className="size-3.5 text-muted-foreground ml-1" strokeWidth={1.75} />
        </button>

        {workspaceOpen && (
          <div className="absolute left-0 mt-2 w-56 rounded-xl border border-border bg-card p-1.5 shadow-xl animate-in fade-in-50 slide-in-from-top-2 duration-150 z-50">
            <div className="px-2.5 py-1.5 text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-widest font-heading">
              Workspaces
            </div>
            <button className="flex items-center gap-2.5 w-full px-2 py-2 rounded-lg bg-secondary/80 text-left">
              <div className="size-5 rounded-md bg-foreground/10 flex items-center justify-center text-[10px] font-bold font-heading">
                T
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-foreground truncate">Primary Workspace</p>
                <p className="text-[10px] text-muted-foreground truncate">{user?.email}</p>
              </div>
              <span className="size-1.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
            </button>
            <div className="my-1 border-t border-border/40" />
            <div className="px-2 py-1.5 flex items-center justify-between text-[10px] text-muted-foreground">
              <span>Gmail Status</span>
              <span className={`inline-flex items-center gap-1 font-semibold ${gmailConnected ? "text-emerald-500" : "text-amber-500"}`}>
                <span className={`size-1.5 rounded-full ${gmailConnected ? "bg-emerald-500" : "bg-amber-500"}`} />
                {gmailConnected ? "Connected" : "Disconnected"}
              </span>
            </div>
          </div>
        )}
      </div>
      </div>{/* end left group */}

      {/* Center: Command Palette Trigger — hidden on mobile */}
      <div className="hidden md:flex flex-1 max-w-md mx-6">
        <button
          onClick={onOpenPalette}
          className="w-full h-9 flex items-center justify-between px-3.5 rounded-lg bg-secondary/30 dark:bg-[#0f0f10] hover:bg-secondary border border-border hover:border-border/80 transition-all duration-150 text-muted-foreground hover:text-foreground text-[13px] cursor-pointer shadow-inner"
        >
          <div className="flex items-center gap-2">
            <Search className="size-4 text-muted-foreground/50" strokeWidth={1.75} />
            <span className="font-medium">Search workspace…</span>
          </div>
          <div className="flex items-center gap-0.5">
            <kbd className="h-5 px-1.5 rounded bg-background border border-border/50 font-mono text-[9px] font-semibold text-muted-foreground/50 flex items-center">
              ⌘
            </kbd>
            <kbd className="h-5 px-1.5 rounded bg-background border border-border/50 font-mono text-[9px] font-semibold text-muted-foreground/50 flex items-center">
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
            className="size-8 rounded-full border border-border/40 overflow-hidden hover:opacity-90 active:scale-95 transition-all duration-150 shadow-sm shrink-0 flex items-center justify-center cursor-pointer"
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
            <div className="absolute right-0 mt-2 w-52 rounded-xl border border-border bg-card p-1.5 shadow-xl animate-in fade-in-50 slide-in-from-top-2 duration-150 z-50">
              <div className="px-3 py-2.5">
                <p className="text-[13px] font-semibold text-foreground leading-tight truncate">{user?.name ?? "User"}</p>
                <p className="text-[11px] text-muted-foreground truncate mt-0.5">{user?.email}</p>
              </div>
              <div className="my-1 border-t border-border/40" />
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 w-full px-2.5 py-2 text-[13px] text-rose-500/80 hover:text-rose-500 hover:bg-rose-500/8 transition-all rounded-lg cursor-pointer"
              >
                <LogOut className="size-4 shrink-0" strokeWidth={1.75} />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

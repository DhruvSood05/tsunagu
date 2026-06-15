"use client";

import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import ThemeToggle from "./ThemeToggle";
import {
  RiInboxLine,
  RiSendPlane2Line,
  RiDraftLine,
  RiArchiveLine,
  RiStarLine,
  RiSparkling2Fill,
  RiSettings3Line,
  RiCalendarLine,
  RiLogoutBoxLine,
  RiAddLine,
} from "@remixicon/react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

interface SidebarProps {
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  } | null;
  onCompose?: () => void;
  gmailConnected?: boolean;
  calendarConnected?: boolean;
}

export default function Sidebar({
  user,
  onCompose,
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentFolder = searchParams.get("folder") ?? "inbox";

  const handleSignOut = async () => {
    await authClient.signOut();
    router.push("/");
  };

  const mainFolders = [
    {
      id: "inbox",
      href: "/dashboard?folder=inbox",
      label: "Inbox",
      icon: RiInboxLine,
    },
    {
      id: "sent",
      href: "/dashboard?folder=sent",
      label: "Sent",
      icon: RiSendPlane2Line,
    },
    {
      id: "drafts",
      href: "/dashboard/drafts",
      label: "Drafts",
      icon: RiDraftLine,
    },
    {
      id: "archive",
      href: "/dashboard?folder=archive",
      label: "Archive",
      icon: RiArchiveLine,
    },
    {
      id: "starred",
      href: "/dashboard?folder=starred",
      label: "Starred",
      icon: RiStarLine,
    },
    {
      id: "calendar",
      href: "/dashboard/calendar",
      label: "Calendar",
      icon: RiCalendarLine,
    },
  ];

  return (
    <aside id="tour-sidebar" className="w-56 shrink-0 border-r border-sidebar-border flex flex-col bg-sidebar h-full z-10 select-none font-sans">
      {/* Workspace Logo */}
      <div className="h-16 flex items-center px-5 border-b border-sidebar-border shrink-0">
        <Link
          href="/dashboard"
          className="flex items-center gap-2.5 hover:opacity-85 transition-opacity"
        >
          <div className="size-6 rounded-md bg-primary flex items-center justify-center shadow-sm">
            <span className="text-primary-foreground text-xs font-bold tracking-tighter select-none font-heading">
              T
            </span>
          </div>
          <span className="font-semibold text-lg tracking-tight text-foreground font-serif leading-none">
            Tsunagu
          </span>
        </Link>
      </div>

      {/* Action Compose */}
      <div id="tour-compose" className="px-4 py-3.5 shrink-0">
        <Button
          onClick={onCompose}
          className="w-full justify-center gap-1.5 py-2 h-9.5 text-[13px] font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all active:scale-[0.98] shadow-sm cursor-pointer"
          size="sm"
        >
          <RiAddLine className="size-4 shrink-0" />
          New Message
        </Button>
      </div>

      {/* Navigation Folders */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-5">
        {/* Folders Section */}
        <div className="space-y-2">
          <p className="px-2.5 py-1 text-[9px] font-bold tracking-widest text-muted-foreground/60 uppercase font-heading">
            Workspace
          </p>
          {mainFolders.map(({ id, href, label, icon: Icon }) => {
            const isPage =
              id === "drafts" || id === "calendar"
                ? pathname === `/dashboard/${id}`
                : pathname === "/dashboard";
            const active =
              id === "drafts" || id === "calendar"
                ? isPage
                : isPage && currentFolder === id;

            return (
              <Link
                key={id}
                href={href}
                className={`relative flex items-center justify-between px-2.5 py-2 text-[13px] rounded-lg transition-all duration-150 ${
                  active
                    ? "bg-card text-foreground font-semibold shadow-sm border border-border/60 before:absolute before:-left-px before:top-1/2 before:-translate-y-1/2 before:h-5 before:w-[3px] before:rounded-full before:bg-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-card/60"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon
                    className={`size-4 shrink-0 ${active ? "text-foreground" : "text-muted-foreground"}`}
                  />
                  <span>{label}</span>
                </div>
              </Link>
            );
          })}
        </div>

        {/* AI & Features Section */}
        <div className="space-y-1">
          <p className="px-2.5 py-1 text-[9px] font-bold tracking-widest text-muted-foreground/60 uppercase font-heading">
            AI Features
          </p>
          <Link
            id="tour-ai-link"
            href="/dashboard/ai"
            className={`relative flex items-center gap-2.5 px-2.5 py-2 text-[13px] rounded-lg transition-all duration-150 ${
              pathname === "/dashboard/ai"
                ? "bg-card text-foreground font-semibold shadow-sm border border-[#8b5cf6]/25 before:absolute before:-left-px before:top-1/2 before:-translate-y-1/2 before:h-5 before:w-[3px] before:rounded-full before:bg-[#8b5cf6]"
                : "text-muted-foreground hover:text-foreground hover:bg-card/60"
            }`}
          >
            <RiSparkling2Fill
              className={`size-4 shrink-0 ${pathname === "/dashboard/ai" ? "text-[#8b5cf6]" : "text-muted-foreground"}`}
            />
            <span>AI Assistant</span>
          </Link>
        </div>
      </div>

      {/* Footer: Settings · Log out · Theme */}
      <div id="tour-settings" className="px-3 py-3 border-t border-sidebar-border space-y-1 shrink-0">
        <button
          onClick={() => {
            const params = new URLSearchParams(searchParams.toString());
            params.set("settings", "true");
            router.push(`${pathname}?${params.toString()}`);
          }}
          className="w-full flex items-center gap-2.5 px-2.5 py-2 text-[13px] rounded-lg text-muted-foreground border border-transparent hover:text-foreground hover:bg-card hover:border-border/60 hover:shadow-sm transition-all duration-150 cursor-pointer"
        >
          <RiSettings3Line className="size-4 shrink-0" />
          Settings
        </button>
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleSignOut}
            className="flex-1 flex items-center gap-2.5 px-2.5 py-2 text-[13px] rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-150 cursor-pointer"
          >
            <RiLogoutBoxLine className="size-4 shrink-0" />
            Log out
          </button>
          <ThemeToggle />
        </div>
      </div>
    </aside>
  );
}

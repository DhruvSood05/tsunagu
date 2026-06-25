"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import ThemeToggle from "./ThemeToggle";
import {
  Inbox,
  Send,
  FileText,
  Archive,
  Star,
  Calendar,
  Sparkles,
  Settings,
  Plus,
  Shield,
  PanelLeftClose,
  PanelLeft,
} from "lucide-react";

const ADMIN_EMAIL = "dhruvsood1102@gmail.com";
import Link from "next/link";
import TsunaguLogo from "@/components/ui/TsunaguLogo";
import { usePathname, useSearchParams } from "next/navigation";

interface SidebarProps {
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  } | null;
  onCompose?: () => void;
  gmailConnected?: boolean;
  calendarConnected?: boolean;
  basePath?: string;
}

export default function Sidebar({ user, onCompose, basePath = "/dashboard" }: SidebarProps) {
  const isSuperAdmin = user?.email === ADMIN_EMAIL;
  const [isAdminRole, setIsAdminRole] = useState(false);
  const isAdmin = isSuperAdmin || isAdminRole;
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentFolder = searchParams.get("folder") ?? "inbox";
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (isSuperAdmin) return;
    fetch("/api/user/role")
      .then((r) => r.json())
      .then((d) => { if (d.role === "admin" || d.role === "superadmin") setIsAdminRole(true); })
      .catch(() => {});
  }, [isSuperAdmin]);

  // Listen for toggle event fired by TopNav hamburger
  useEffect(() => {
    const handler = () => setMobileOpen((v) => !v);
    window.addEventListener("toggle-mobile-sidebar", handler);
    return () => window.removeEventListener("toggle-mobile-sidebar", handler);
  }, []);

  // Close on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const mainFolders = [
    { id: "inbox",    href: `${basePath}?folder=inbox`,   label: "Inbox",    icon: Inbox },
    { id: "sent",     href: `${basePath}?folder=sent`,    label: "Sent",     icon: Send },
    { id: "drafts",   href: `${basePath}/drafts`,         label: "Drafts",   icon: FileText },
    { id: "archive",  href: `${basePath}?folder=archive`, label: "Archive",  icon: Archive },
    { id: "starred",  href: `${basePath}?folder=starred`, label: "Starred",  icon: Star },
    { id: "calendar", href: `${basePath}/calendar`,       label: "Calendar", icon: Calendar },
  ];

  const sidebarContent = (
    <>
      {/* Logo + Collapse toggle */}
      <div className="h-14 flex items-center justify-between px-4 border-b border-sidebar-border shrink-0">
        <Link href={basePath} className="flex items-center gap-2.5 hover:opacity-85 transition-opacity overflow-hidden">
          <TsunaguLogo className="size-6 text-primary shrink-0" />
          {!collapsed && (
            <span className="font-semibold text-[15px] tracking-tight text-foreground leading-none whitespace-nowrap">
              Tsunagu
            </span>
          )}
        </Link>
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="hidden md:flex size-7 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-card/60 transition-all duration-150 cursor-pointer shrink-0"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <PanelLeft className="size-4" strokeWidth={1.75} />
          ) : (
            <PanelLeftClose className="size-4" strokeWidth={1.75} />
          )}
        </button>
      </div>

      {/* Compose */}
      <div id="tour-compose" className={`px-3 py-3 shrink-0 ${collapsed ? "flex justify-center" : ""}`}>
        {collapsed ? (
          <button
            onClick={() => { onCompose?.(); setMobileOpen(false); }}
            className="size-9 flex items-center justify-center rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all active:scale-[0.97] shadow-sm cursor-pointer"
            title="New Message"
          >
            <Plus className="size-4" strokeWidth={2} />
          </button>
        ) : (
          <Button
            onClick={() => { onCompose?.(); setMobileOpen(false); }}
            className="w-full justify-center gap-1.5 py-2 h-9 text-[13px] font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all active:scale-[0.98] shadow-sm cursor-pointer"
            size="sm"
          >
            <Plus className="size-4 shrink-0" strokeWidth={2} />
            New Message
          </Button>
        )}
      </div>

      {/* Nav */}
      <div className="flex-1 overflow-y-auto px-2.5 py-2 space-y-5">
        <div className="space-y-0.5">
          {!collapsed && (
            <p className="px-2.5 py-1.5 text-[10px] font-semibold tracking-widest text-muted-foreground/50 uppercase font-heading">
              Workspace
            </p>
          )}
          {mainFolders.map(({ id, href, label, icon: Icon }) => {
            const isPage = id === "drafts" || id === "calendar" ? pathname === `${basePath}/${id}` : pathname === basePath;
            const active = id === "drafts" || id === "calendar" ? isPage : isPage && currentFolder === id;
            return (
              <Link
                key={id}
                href={href}
                title={collapsed ? label : undefined}
                className={`relative flex items-center gap-2.5 rounded-lg transition-all duration-150 ${
                  collapsed ? "justify-center px-0 py-2.5 mx-0.5" : "px-2.5 py-2"
                } text-[13px] ${
                  active
                    ? "bg-secondary text-foreground font-medium shadow-sm border border-border"
                    : "text-muted-foreground hover:text-foreground hover:bg-foreground/5 dark:hover:bg-[#202022]"
                }`}
              >
                {active && !collapsed && (
                  <span className="absolute -left-px top-1/2 -translate-y-1/2 h-4 w-[3px] rounded-full bg-primary" />
                )}
                <Icon className={`size-[18px] shrink-0 ${active ? "text-foreground" : "text-muted-foreground/70"}`} strokeWidth={1.75} />
                {!collapsed && <span>{label}</span>}
              </Link>
            );
          })}
        </div>

        <div className="space-y-0.5">
          {!collapsed && (
            <p className="px-2.5 py-1.5 text-[10px] font-semibold tracking-widest text-muted-foreground/50 uppercase font-heading">
              AI
            </p>
          )}
          <Link
            id="tour-ai-link"
            href={`${basePath}/ai`}
            title={collapsed ? "AI Assistant" : undefined}
            className={`relative flex items-center gap-2.5 rounded-lg transition-all duration-150 ${
              collapsed ? "justify-center px-0 py-2.5 mx-0.5" : "px-2.5 py-2"
            } text-[13px] ${
              pathname === `${basePath}/ai`
                ? "bg-ai-surface text-foreground font-medium shadow-sm border border-ai/20"
                : "text-muted-foreground hover:text-foreground hover:bg-foreground/5 dark:hover:bg-[#202022]"
            }`}
          >
            {pathname === `${basePath}/ai` && !collapsed && (
              <span className="absolute -left-px top-1/2 -translate-y-1/2 h-4 w-[3px] rounded-full bg-ai" />
            )}
            <Sparkles
              className={`size-[18px] shrink-0 ${pathname === "/dashboard/ai" ? "text-ai" : "text-muted-foreground/70"}`}
              strokeWidth={1.75}
            />
            {!collapsed && <span>AI Assistant</span>}
          </Link>
        </div>

        {isAdmin && (
          <div className="space-y-0.5">
            {!collapsed && (
              <p className="px-2.5 py-1.5 text-[10px] font-semibold tracking-widest text-muted-foreground/50 uppercase font-heading">
                Admin
              </p>
            )}
            <Link
              href={`${basePath}/admin`}
              title={collapsed ? "Dashboard" : undefined}
              className={`relative flex items-center gap-2.5 rounded-lg transition-all duration-150 ${
                collapsed ? "justify-center px-0 py-2.5 mx-0.5" : "px-2.5 py-2"
              } text-[13px] ${
                pathname === `${basePath}/admin`
                  ? "bg-secondary text-foreground font-medium shadow-sm border border-border"
                  : "text-muted-foreground hover:text-foreground hover:bg-foreground/5 dark:hover:bg-[#202022]"
              }`}
            >
              {pathname === `${basePath}/admin` && !collapsed && (
                <span className="absolute -left-px top-1/2 -translate-y-1/2 h-4 w-[3px] rounded-full bg-foreground" />
              )}
              <Shield
                className={`size-[18px] shrink-0 ${pathname === `${basePath}/admin` ? "text-foreground" : "text-muted-foreground/70"}`}
                strokeWidth={1.75}
              />
              {!collapsed && <span>Dashboard</span>}
            </Link>
          </div>
        )}
      </div>

      {/* Footer */}
      <div id="tour-settings" className="px-2.5 py-3 border-t border-sidebar-border shrink-0">
        <div className={`flex items-center ${collapsed ? "flex-col gap-2" : "gap-1.5"}`}>
          <Link
            href={`${basePath}/settings`}
            title={collapsed ? "Settings" : undefined}
            className={`relative flex items-center gap-2.5 rounded-lg transition-all duration-150 ${
              collapsed ? "justify-center px-0 py-2.5 w-full" : "flex-1 px-2.5 py-2"
            } text-[13px] ${
              pathname === `${basePath}/settings`
                ? "bg-secondary text-foreground font-medium shadow-sm border border-border"
                : "text-muted-foreground hover:text-foreground hover:bg-foreground/5 dark:hover:bg-[#202022]"
            }`}
          >
            {pathname === `${basePath}/settings` && !collapsed && (
              <span className="absolute -left-px top-1/2 -translate-y-1/2 h-4 w-[3px] rounded-full bg-foreground" />
            )}
            <Settings
              className={`size-[18px] shrink-0 ${pathname === `${basePath}/settings` ? "text-foreground" : "text-muted-foreground/70"}`}
              strokeWidth={1.75}
            />
            {!collapsed && <span>Settings</span>}
          </Link>
          <ThemeToggle />
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Desktop: collapsible sidebar. Mobile: slide-in overlay drawer */}
      <aside
        id="tour-sidebar"
        className={`
          shrink-0 border-r border-sidebar-border flex flex-col bg-sidebar h-full z-50 select-none font-sans
          md:relative md:translate-x-0 md:flex
          fixed inset-y-0 left-0 transition-all duration-250 ease-out
          ${collapsed ? "md:w-[56px]" : "md:w-[240px]"}
          ${mobileOpen ? "flex translate-x-0 w-[240px]" : "-translate-x-full md:translate-x-0"}
        `}
      >
        {sidebarContent}
      </aside>
    </>
  );
}

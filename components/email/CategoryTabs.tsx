"use client";

import {
  Mail,
  Megaphone,
  Users,
  Bell,
} from "lucide-react";

export type Category = "primary" | "promotions" | "social" | "updates";

const TABS: { id: Category; label: string; icon: React.ElementType }[] = [
  { id: "primary",    label: "Primary",    icon: Mail },
  { id: "promotions", label: "Promotions", icon: Megaphone },
  { id: "social",     label: "Social",     icon: Users },
  { id: "updates",    label: "Updates",    icon: Bell },
];

interface CategoryTabsProps {
  active: Category;
  onChange: (category: Category) => void;
  loading?: boolean;
}

export default function CategoryTabs({ active, onChange, loading }: CategoryTabsProps) {
  return (
    <div className="px-4 py-2.5 border-b border-border/30 shrink-0 flex items-center bg-card select-none font-sans">
      {/* nav-pill-group — inset tray (deepest tone), lifted active pill */}
      <div className="flex bg-background border border-border/50 rounded-lg p-1 gap-1">
        {TABS.map(({ id, label, icon: Icon }) => {
          const isActive = active === id;
          return (
            <button
              key={id}
              onClick={() => !loading && onChange(id)}
              disabled={loading && !isActive}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 text-[11px] font-semibold rounded-md transition-all duration-200 whitespace-nowrap cursor-pointer ${
                isActive
                  ? "bg-card text-foreground shadow-sm border border-border/60"
                  : "text-muted-foreground hover:text-foreground hover:bg-card/50 border border-transparent"
              }`}
            >
              <Icon className={`size-3.5 shrink-0 transition-colors ${isActive ? "text-foreground" : "text-muted-foreground/60"}`} strokeWidth={1.75} />
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

"use client";

import {
  RiMailLine,
  RiMegaphoneLine,
  RiGroupLine,
  RiBellLine,
} from "@remixicon/react";

export type Category = "primary" | "promotions" | "social" | "updates";

const TABS: { id: Category; label: string; icon: React.ElementType }[] = [
  { id: "primary",    label: "Primary",    icon: RiMailLine },
  { id: "promotions", label: "Promotions", icon: RiMegaphoneLine },
  { id: "social",     label: "Social",     icon: RiGroupLine },
  { id: "updates",    label: "Updates",    icon: RiBellLine },
];

interface CategoryTabsProps {
  active: Category;
  onChange: (category: Category) => void;
  loading?: boolean;
}

export default function CategoryTabs({ active, onChange, loading }: CategoryTabsProps) {
  return (
    <div className="flex border-b shrink-0">
      {TABS.map(({ id, label, icon: Icon }) => {
        const isActive = active === id;
        return (
          <button
            key={id}
            onClick={() => onChange(id)}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs border-b-2 -mb-px transition-colors whitespace-nowrap ${
              isActive
                ? "border-primary text-foreground font-medium"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className="size-3.5 shrink-0" />
            {label}
            {isActive && loading && (
              <span className="size-3 rounded-full border border-current border-t-transparent animate-spin opacity-50 shrink-0" />
            )}
          </button>
        );
      })}
    </div>
  );
}

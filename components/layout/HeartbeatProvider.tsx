"use client";

import { useHeartbeat } from "@/hooks/useHeartbeat";

export function HeartbeatProvider({ children }: { children: React.ReactNode }) {
  useHeartbeat();
  return <>{children}</>;
}

import { useEffect } from "react";
import { authClient } from "@/lib/auth-client";

/**
 * Hook to track real-time user presence.
 * Pings the heartbeat endpoint every 3 minutes, but ONLY if the document is visible.
 * This ensures accurate "Active" status in the admin dashboard without writing
 * to the database on every single API request.
 */
export function useHeartbeat() {
  const { data: session } = authClient.useSession();

  useEffect(() => {
    if (!session?.user) return;

    // Ping immediately on mount
    const ping = () => {
      if (document.visibilityState === "visible") {
        fetch("/api/user/heartbeat", { method: "POST" }).catch(() => {
          // Silent catch to prevent console errors if network flakes
        });
      }
    };

    ping();

    // Ping every 3 minutes
    const interval = setInterval(ping, 3 * 60 * 1000);

    // Also ping when the user returns to the tab
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        ping();
      }
    };

    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [session?.user]);
}

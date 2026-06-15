"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import "driver.js/dist/driver.css";
import WelcomeModal from "./WelcomeModal";

interface WalkthroughTourProps {
  hasSeenTour: boolean;
  onTourComplete: () => void;
}

type Phase = "idle" | "welcome" | "tour" | "done";

export default function WalkthroughTour({ hasSeenTour, onTourComplete }: WalkthroughTourProps) {
  const [phase, setPhase] = useState<Phase>("idle");
  const tourStarted = useRef(false);
  const pathname = usePathname();

  // Show the welcome modal once, on the main dashboard, for users who haven't seen it
  useEffect(() => {
    if (hasSeenTour || phase !== "idle" || pathname !== "/dashboard") return;
    const timer = setTimeout(() => setPhase("welcome"), 600);
    return () => clearTimeout(timer);
  }, [hasSeenTour, phase, pathname]);

  const handleSkip = () => {
    setPhase("done");
    onTourComplete();
  };

  const startSpotlight = async () => {
    if (tourStarted.current) return;
    tourStarted.current = true;
    setPhase("tour");

    const { driver } = await import("driver.js");

    const driverObj = driver({
      showProgress: true,
      animate: true,
      popoverClass: "tsunagu-tour",
      overlayColor: "#0b0b0e",
      overlayOpacity: 0.6,
      stagePadding: 8,
      stageRadius: 10,
      smoothScroll: true,
      allowClose: true,
      progressText: "{{current}} / {{total}}",
      nextBtnText: "Next →",
      prevBtnText: "← Back",
      doneBtnText: "Start using Tsunagu",
      onDestroyStarted: () => {
        onTourComplete();
        setPhase("done");
        driverObj.destroy();
      },
      steps: [
        {
          element: "#tour-sidebar",
          popover: {
            title: "Your workspace 👋",
            description:
              "Navigate between Inbox, Calendar, Drafts, Starred, and the AI Assistant — all from this sidebar.",
            side: "right",
            align: "start",
          },
        },
        {
          element: "#tour-compose",
          popover: {
            title: "Compose instantly",
            description:
              "Start a new email here, or just press <kbd>C</kbd> anywhere in your inbox to pop open the composer.",
            side: "right",
            align: "start",
          },
        },
        {
          element: "#tour-inbox",
          popover: {
            title: "A keyboard-first inbox",
            description:
              "Bold means unread. Fly through with <kbd>J</kbd> / <kbd>K</kbd> to move, <kbd>E</kbd> to archive, and <kbd>R</kbd> to reply — no mouse needed.",
            side: "right",
            align: "start",
          },
        },
        {
          element: "#tour-search",
          popover: {
            title: "Search everything",
            description:
              "Find any email here — or press <kbd>Cmd</kbd> + <kbd>K</kbd> to search across your inbox and calendar at once.",
            side: "bottom",
            align: "start",
          },
        },
        {
          element: "#tour-ai-link",
          popover: {
            title: "Meet your AI Assistant ✨",
            description:
              "Draft replies, summarize your inbox, and manage your calendar just by chatting. Jump here anytime with <kbd>Alt</kbd> + <kbd>A</kbd>.",
            side: "right",
            align: "start",
          },
        },
        {
          element: "#tour-settings",
          popover: {
            title: "Settings & shortcuts",
            description:
              "Switch themes, manage your Gmail and Calendar connections, or replay this tour anytime. Press <kbd>?</kbd> to see every shortcut.",
            side: "top",
            align: "start",
          },
        },
        {
          popover: {
            title: "You're all set 🎉",
            description:
              "That's the tour! Press <kbd>?</kbd> anytime for shortcuts, or <kbd>Alt</kbd> + <kbd>A</kbd> to ask your AI assistant anything. Enjoy a calmer inbox.",
          },
        },
      ],
    });

    driverObj.drive();
  };

  return (
    <WelcomeModal
      open={phase === "welcome"}
      onStartTour={startSpotlight}
      onSkip={handleSkip}
    />
  );
}

"use client";

import { useDemoContext } from "@/lib/demo/DemoContext";
import { X, Sparkles } from "lucide-react";
import { authClient } from "@/lib/auth-client";

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

export default function DemoSignInModal() {
  const { showSignInModal, setShowSignInModal } = useDemoContext();
  if (!showSignInModal) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => setShowSignInModal(false)}
      />

      {/* Modal */}
      <div className="relative bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md p-6 font-sans animate-in zoom-in-95 duration-200">
        {/* Close */}
        <button
          onClick={() => setShowSignInModal(false)}
          className="absolute top-4 right-4 size-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
        >
          <X className="size-4" strokeWidth={1.75} />
        </button>

        {/* Icon */}
        <div className="size-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
          <Sparkles className="size-5 text-primary" strokeWidth={1.75} />
        </div>

        {/* Copy */}
        <h2 className="text-[18px] font-bold font-heading text-foreground tracking-tight mb-2">
          Continue with your Google account
        </h2>
        <p className="text-[13px] text-muted-foreground leading-relaxed mb-6">
          You're currently exploring Tsunagu with sample data. Connect your Gmail and Google Calendar to unlock AI-powered email and calendar management.
        </p>

        {/* Features */}
        <ul className="space-y-2 mb-6">
          {[
            "AI drafts replies in your voice",
            "Intelligent calendar scheduling",
            "Semantic search across your inbox",
            "Real-time Gmail & Calendar sync",
          ].map((f) => (
            <li key={f} className="flex items-center gap-2.5 text-[12.5px] text-foreground/80">
              <span className="size-4 rounded-full bg-primary/15 border border-primary/25 flex items-center justify-center shrink-0">
                <span className="size-1.5 rounded-full bg-primary" />
              </span>
              {f}
            </li>
          ))}
        </ul>

        {/* CTAs */}
        <div className="flex flex-col gap-2.5">
          <button
            onClick={() => authClient.signIn.social({ provider: "google", callbackURL: "/dashboard" })}
            className="flex items-center justify-center gap-2.5 w-full px-4 py-3 rounded-xl bg-primary text-primary-foreground text-[13px] font-semibold hover:bg-primary/90 transition-colors cursor-pointer shadow-lg shadow-primary/20"
          >
            <GoogleIcon className="size-4" />
            Sign in with Google
          </button>
          <button
            onClick={() => setShowSignInModal(false)}
            className="w-full px-4 py-2.5 rounded-xl border border-border text-[13px] font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
          >
            Continue Demo
          </button>
        </div>

        <p className="text-center text-[11px] text-muted-foreground/60 mt-4">
          No credit card required · Works with your existing Gmail
        </p>
      </div>
    </div>
  );
}

"use client";

import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { RiGoogleFill, RiMailLine } from "@remixicon/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";

function PageContent() {
  const { data: session, isPending } = authClient.useSession();
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const router = useRouter();

  useEffect(() => {
    if (session) router.push("/dashboard");
  }, [session, router]);

  if (isPending || session) return null;

  return (
    <div className="flex min-h-screen">
      {/* Left panel — branding */}
      <div className="hidden lg:flex w-1/2 bg-primary flex-col justify-between p-12">
        <div className="flex items-center gap-2">
          <RiMailLine className="text-primary-foreground size-5" />
          <span className="text-primary-foreground font-semibold text-sm tracking-wide">
            Tsunagu
          </span>
        </div>
        <div>
          <blockquote className="text-primary-foreground/80 text-sm leading-relaxed italic">
            &ldquo;The fastest way to manage your Gmail inbox across every account.&rdquo;
          </blockquote>
        </div>
      </div>

      {/* Right panel — sign in */}
      <div className="flex flex-1 flex-col items-center justify-center px-8">
        <div className="w-full max-w-sm space-y-8">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 lg:hidden">
            <RiMailLine className="size-5 text-foreground" />
            <span className="font-semibold text-sm">Tsunagu</span>
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
            <p className="text-sm text-muted-foreground">
              Sign in to access your Gmail dashboard.
            </p>
          </div>

          {error && (
            <div className="border border-destructive/40 bg-destructive/5 px-3 py-2 text-xs text-destructive">
              Authentication failed. Please try again.
            </div>
          )}

          <Button
            size="lg"
            className="w-full gap-2"
            onClick={() =>
              authClient.signIn.social({ provider: "google", callbackURL: "/dashboard" })
            }
          >
            <RiGoogleFill className="size-4" />
            Continue with Google
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            By signing in, you agree to allow Tsunagu to access your Gmail on your behalf.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense>
      <PageContent />
    </Suspense>
  );
}

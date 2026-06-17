import Sidebar from "@/components/layout/Sidebar";
import TopNav from "@/components/layout/TopNav";
import { RiLockLine, RiRobot2Line, RiMailLine } from "@remixicon/react";

interface Props {
  user: { name?: string | null; email?: string | null; image?: string | null };
}

export default function AILockedPage({ user }: Props) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar user={user} gmailConnected={false} calendarConnected={false} />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <TopNav user={user} gmailConnected={false} />
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="max-w-sm w-full text-center space-y-6">
            <div className="mx-auto size-20 rounded-3xl bg-secondary border border-border/60 flex items-center justify-center shadow-sm">
              <div className="relative">
                <RiRobot2Line className="size-9 text-muted-foreground/40" />
                <div className="absolute -bottom-1 -right-1 size-5 rounded-full bg-background border border-border/60 flex items-center justify-center">
                  <RiLockLine className="size-3 text-muted-foreground/60" />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold text-foreground tracking-tight">AI Access Required</h2>
              <p className="text-[13px] text-muted-foreground leading-relaxed">
                Tsunagu AI is available to users with granted access. Contact your admin to request access to the AI assistant.
              </p>
            </div>

            <div className="bg-secondary/40 border border-border/50 rounded-2xl p-4 text-left space-y-3">
              <p className="text-[11px] font-bold text-muted-foreground/50 uppercase tracking-widest">What you get with AI access</p>
              {[
                "Read, summarise & search your Gmail inbox",
                "Draft, reply and send emails",
                "Manage Google Calendar events",
                "Long-term memory across conversations",
              ].map((item) => (
                <div key={item} className="flex items-center gap-2.5">
                  <div className="size-4 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                    <div className="size-1.5 rounded-full bg-primary" />
                  </div>
                  <span className="text-[12.5px] text-foreground/80">{item}</span>
                </div>
              ))}
            </div>

            <a
              href="mailto:dhruvsood1102@gmail.com?subject=Tsunagu AI Access Request"
              className="w-full flex items-center justify-center gap-2 py-2.5 text-[13px] font-semibold bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shadow-sm shadow-primary/20 transition-all cursor-pointer"
            >
              <RiMailLine className="size-4" />
              Request Access
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

import { inngest } from "@/lib/inngest";
import { db } from "@/db";
import { webhookEvents } from "@/db/schema";

export const calendarEventChanged = inngest.createFunction(
  {
    id: "calendar-event-changed",
    name: "Calendar: Event Changed",
    triggers: [{ event: "tsunagu/calendar.event.changed" }],
  },
  async ({ event }: { event: { data: { userId: string; channelId: string; resourceState: string } } }) => {
    const { userId, channelId, resourceState } = event.data;

    // Skip sync notifications (fired when a watch is first registered)
    if (resourceState === "sync") return { skipped: true };

    await db.insert(webhookEvents).values({
      id: crypto.randomUUID(),
      userId,
      eventType: "calendar",
      receivedAt: new Date(),
    });

    return { userId, channelId, resourceState };
  },
);

import { inngest } from "@/lib/inngest";
import { db } from "@/db";
import { webhookEvents } from "@/db/schema";

export const gmailMessageReceived = inngest.createFunction(
  {
    id: "gmail-message-received",
    name: "Gmail: Message Received",
    triggers: [{ event: "tsunagu/gmail.message.received" }],
  },
  async ({ event }: { event: { data: { userId: string; emailAddress: string; historyId: string } } }) => {
    const { userId, emailAddress, historyId } = event.data;

    await db.insert(webhookEvents).values({
      id: crypto.randomUUID(),
      userId,
      eventType: "gmail",
      receivedAt: new Date(),
    });

    return { userId, emailAddress, historyId };
  },
);

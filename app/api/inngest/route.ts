import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest";
import { gmailMessageReceived } from "@/inngest/functions/gmail";
import { calendarEventChanged } from "@/inngest/functions/calendar";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [gmailMessageReceived, calendarEventChanged],
});

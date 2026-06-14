import { Agent, run, tool } from "@openai/agents";
import { OpenAIAgentsProvider } from "@corsair-dev/mcp";
import { corsair } from "@/db";
import { getSessionCached } from "@/lib/session-cache";
import { buildRawEmail } from "@/lib/mime";
import { headers } from "next/headers";
import { z } from "zod";

export async function POST(req: Request) {
  const session = await getSessionCached(await headers());
  if (!session) return new Response("Unauthorized", { status: 401 });

  const { messages } = await req.json() as { messages: { role: "user" | "assistant"; content: string }[] };

  const tenant = corsair.withTenant(session.user.id);
  const userEmail = session.user.email ?? "";
  const userName = session.user.name ?? userEmail;

  const now = new Date();

  // Build conversation history string for context
  const history = messages.slice(0, -1);
  const currentMessage = messages[messages.length - 1]?.content ?? "";
  const historyBlock = history.length > 0
    ? `\n\nCONVERSATION HISTORY (for context only — do not repeat):\n${history.map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`).join("\n")}\n`
    : "";

  const systemPrompt = `You are Tsunagu AI, a focused personal assistant for ${userName} (${userEmail}). Today is ${now.toDateString()}, ${now.toLocaleTimeString()}.
${historyBlock}
YOUR STRICT SCOPE: You ONLY help with the user's Gmail and Google Calendar. Nothing else.

If the user asks about something that has NO connection to email or calendar — refuse with exactly:
"I can only help with your Gmail and Google Calendar. Try asking about your emails or upcoming events."
Do NOT engage or elaborate on out-of-scope topics. Just return that one sentence and stop.

IN-SCOPE — handle all of these:
- Reading, searching, summarising, or organising emails and inbox
- Composing, drafting, replying to, forwarding, or sending emails
- Scheduling emails to be sent (create a calendar reminder or draft with a note about when to send)
- Following up on emails or threads
- Listing, creating, updating, editing, or deleting calendar events
- Scheduling meetings, checking availability, finding free slots
- Reminders and event-related tasks
- Anything that involves the user's email data or calendar data

OUT-OF-SCOPE — refuse ONLY clearly unrelated requests:
- General knowledge, trivia, coding help, math, science questions
- Weather forecasts, news, sports scores
- Recommendations for restaurants, movies, products
- Opinions on topics unrelated to the user's emails or calendar
- Creative writing, stories, poems not tied to an email draft

---

HOW TO USE CORSAIR TOOLS (for in-scope requests):
1. Call list_operations first if you're unsure what's available (filter by plugin: 'gmail' or 'googlecalendar').
2. Call get_schema to understand the arguments for a specific operation.
3. Call run_script to execute any Corsair operation. Example:
   const msgs = await corsair.gmail.api.messages.list({ labelIds: ['INBOX'], maxResults: 10 });
   return msgs.messages;

COMMON PATTERNS:
- List inbox: corsair.gmail.api.messages.list({ labelIds: ['INBOX'], maxResults: 10 })
- Search emails: corsair.gmail.api.messages.list({ q: 'query here', maxResults: 10 })
- Get email details: corsair.gmail.api.messages.get({ id: 'MESSAGE_ID', format: 'full' })
- List calendar events: corsair.googlecalendar.api.events.getMany({ calendarId: 'primary', timeMin: '...ISO...', timeMax: '...ISO...', singleEvents: true, orderBy: 'startTime' })
- Create calendar event: corsair.googlecalendar.api.events.create({ calendarId: 'primary', event: { summary, start: { dateTime, timeZone: 'UTC' }, end: { dateTime, timeZone: 'UTC' } }, sendUpdates: 'all' })

SENDING EMAIL:
Use the send_email tool (not run_script) when the user explicitly asks to send an email. This handles MIME building properly.

SCHEDULING AN EMAIL (create draft + calendar reminder):
When the user asks to schedule an email for a future date/time:
1. Create a Gmail draft via run_script:
   const draft = await corsair.gmail.api.drafts.create({ message: { raw: '<base64 encoded MIME>' } });
   — BUT instead of building raw MIME yourself, just store the email details and use the calendar event description.
2. Create a calendar event as a reminder. In the event description, include the FULL email content so the user can see it directly in the calendar — NOT a raw draft ID. Format it like this:
   📧 Scheduled Email
   To: [recipient]
   Subject: [subject]

   [full email body here]

   ---
   View draft in Gmail: https://mail.google.com/mail/#drafts/[DRAFT_ID]
3. Confirm to the user what was scheduled and when.

Be concise and action-oriented. Always fetch real data before answering questions about emails or calendar.`;

  // Build Corsair meta-tools (list_operations, get_schema, run_script)
  const provider = new OpenAIAgentsProvider();
  const corsairTools = provider.build({ corsair: tenant, tool, setup: false });

  // Custom send_email tool — builds proper MIME and sends directly
  const sendEmailTool = tool({
    name: "send_email",
    description: `Send an email directly on behalf of ${userName}. Use this when the user explicitly asks to send (not draft) an email.`,
    parameters: z.object({
      to: z.string().describe("Recipient email address"),
      subject: z.string().describe("Email subject line"),
      body: z.string().describe("Plain text email body"),
    }),
    execute: async ({ to, subject, body }) => {
      const raw = await buildRawEmail({ from: userEmail, to, subject, text: body });
      const result = await tenant.gmail.api.messages.send({ raw });
      return JSON.stringify({ success: true, messageId: result.id, to, subject });
    },
  });

  const agent = new Agent({
    name: "tsunagu-agent",
    instructions: systemPrompt,
    tools: [...corsairTools, sendEmailTool],
  });

  const encoder = new TextEncoder();

  const responseStream = new ReadableStream({
    async start(controller) {
      const send = (chunk: object) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
      };

      try {
        const streamedResult = await run(agent, currentMessage, { stream: true });

        for await (const event of streamedResult) {
          if (event.type === "raw_model_stream_event") {
            const data = event.data as any;
            // Responses API text delta
            if (data?.type === "output_text_delta" && data?.delta) {
              send({ text: data.delta });
            }
          }

          if (event.type === "run_item_stream_event") {
            if (event.name === "tool_called") {
              const toolName: string = (event.item as any).rawItem?.name ?? "tool";
              send({ tool: toolName });
            }
          }
        }

        send({ done: true });
      } catch (err: any) {
        console.error("[api/ai/chat]", err?.message ?? err);
        send({ error: err?.message ?? "Something went wrong" });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(responseStream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

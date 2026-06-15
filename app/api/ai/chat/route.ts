import { Agent, run, tool } from "@openai/agents";
import { OpenAIAgentsProvider } from "@corsair-dev/mcp";
import { corsair, db } from "@/db";
import { chatMessages, chatSessions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSessionCached } from "@/lib/session-cache";
import { buildRawEmail } from "@/lib/mime";
import { headers } from "next/headers";
import { z } from "zod";

export async function POST(req: Request) {
  const session = await getSessionCached(await headers());
  if (!session) return new Response("Unauthorized", { status: 401 });

  const { messages, sessionId } = await req.json() as {
    messages: { role: "user" | "assistant"; content: string }[];
    sessionId?: string;
  };

  const tenant = corsair.withTenant(session.user.id);
  const userEmail = session.user.email ?? "";
  const userName = session.user.name ?? userEmail;

  const now = new Date();

  const systemPrompt = `You are Tsunagu AI, a focused personal assistant for ${userName} (${userEmail}). Today is ${now.toDateString()}, ${now.toLocaleTimeString()}.

YOUR SCOPE: You are a personal assistant focused on Gmail and Google Calendar. Handle all email and calendar tasks. Also respond naturally to casual conversation, greetings, compliments, small talk, and social messages — be friendly and brief in those cases.

Only refuse when the user is explicitly asking you to perform a task that has nothing to do with email or calendar — for example: "solve this coding problem", "what's the weather today", "write me a poem", "explain quantum physics". In those cases refuse with exactly:
"I can only help with your Gmail and Google Calendar. Try asking about your emails or upcoming events."

IN-SCOPE — handle all of these:
- Reading, searching, summarising, or organising emails and inbox
- Composing, drafting, replying to, forwarding, or sending emails
- Scheduling emails to be sent (create a calendar reminder or draft with a note about when to send)
- Following up on emails or threads
- Listing, creating, updating, editing, or deleting calendar events
- Scheduling meetings, checking availability, finding free slots
- Reminders and event-related tasks
- Anything that involves the user's email data or calendar data
- Casual conversation, greetings, compliments, small talk — respond briefly and naturally

OUT-OF-SCOPE — refuse ONLY explicit requests to perform unrelated tasks:
- Requests for coding help, math problems, science explanations
- Requests for weather forecasts, news summaries, sports scores
- Requests for restaurant/movie/product recommendations
- Requests to write poems, stories, or creative content not tied to an email draft

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

FOLLOW-UP AND CONVERSATION RULES — read these carefully:
- You have the full conversation history. Use it. Never repeat a question you already asked.
- When the user replies with a short affirmative ("yes", "sure", "go ahead", "please", "ok", "yep", "do it") — look at your previous message to understand what they agreed to, then execute it immediately. Do NOT re-summarise or re-ask the question.
- When the user asks for a "day by day", "daily", "per day", or "breakdown by day" view: actually group the data by calendar date and create a separate section for each day (e.g. "**Monday Jun 16**" followed by that day's items as a list). Do NOT simply bold the dates inline within a flat paragraph — restructure into real per-day sections with their own content.
- Always move the conversation forward. If you already fetched and presented data, do not re-fetch the same data unless the user explicitly asks you to refresh.

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

  // Save the latest user message to DB if we have a sessionId
  const userMessage = messages[messages.length - 1];
  if (sessionId && userMessage?.role === "user") {
    await db.insert(chatMessages).values({
      id: crypto.randomUUID(),
      sessionId,
      userId: session.user.id,
      role: "user",
      content: userMessage.content,
      createdAt: new Date(),
    });

    // Auto-title session from first user message
    const isFirstMessage = messages.filter((m) => m.role === "user").length === 1;
    if (isFirstMessage) {
      const title = userMessage.content.slice(0, 60) + (userMessage.content.length > 60 ? "…" : "");
      await db.update(chatSessions).set({ title, updatedAt: new Date() }).where(eq(chatSessions.id, sessionId));
    } else {
      await db.update(chatSessions).set({ updatedAt: new Date() }).where(eq(chatSessions.id, sessionId));
    }
  }

  const responseStream = new ReadableStream({
    async start(controller) {
      const send = (chunk: object) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
      };

      try {
        const conversationInput = messages.map((m) => {
          if (m.role === "user") {
            return { role: "user" as const, content: m.content };
          }
          return {
            role: "assistant" as const,
            status: "completed" as const,
            content: [{ type: "output_text" as const, text: m.content }],
          };
        });
        const streamedResult = await run(agent, conversationInput, { stream: true });

        let fullText = "";
        const usedTools: string[] = [];

        for await (const event of streamedResult) {
          if (event.type === "raw_model_stream_event") {
            const data = event.data as any;
            if (data?.type === "output_text_delta" && data?.delta) {
              fullText += data.delta;
              send({ text: data.delta });
            }
          }

          if (event.type === "run_item_stream_event") {
            if (event.name === "tool_called") {
              const toolName: string = (event.item as any).rawItem?.name ?? "tool";
              if (!usedTools.includes(toolName)) usedTools.push(toolName);
              send({ tool: toolName });
            }
          }
        }

        // Persist assistant reply to DB
        if (sessionId && fullText) {
          await db.insert(chatMessages).values({
            id: crypto.randomUUID(),
            sessionId,
            userId: session.user.id,
            role: "assistant",
            content: fullText || "Done.",
            toolsUsed: usedTools.length > 0 ? usedTools : null,
            createdAt: new Date(),
          });
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

export const maxDuration = 60;

import { Agent, run, tool } from "@openai/agents";
import { OpenAIAgentsProvider } from "@corsair-dev/mcp";
import { corsair, db } from "@/db";
import { chatMessages, chatSessions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { checkAndIncrementUsage } from "@/lib/ai-rate-limit";
import { getSessionCached } from "@/lib/session-cache";
import { buildRawEmail } from "@/lib/mime";
import { headers } from "next/headers";
import { z } from "zod";
import type { ChatArtifact } from "@/types/ai";

// Turn a tool call into a renderable chat artifact (email draft / event card).
function buildArtifact(toolName: string, rawArgs: unknown): ChatArtifact | null {
  let args: any = {};
  try {
    args = typeof rawArgs === "string" ? JSON.parse(rawArgs) : (rawArgs ?? {});
  } catch {
    return null;
  }

  if (toolName === "draft_email") {
    if (!args.to && !args.subject && !args.body) return null;
    return {
      kind: "email",
      status: "draft" as const,
      to: args.to ?? "",
      subject: args.subject ?? "",
      body: args.body ?? "",
    };
  }

  if (toolName === "create_calendar_event") {
    if (!args.summary && !args.start) return null;
    return {
      kind: "event",
      summary: args.summary ?? "(No title)",
      start: args.start ?? null,
      end: args.end ?? null,
      timeZone: args.timeZone ?? null,
      location: args.location ?? null,
      description: args.description ?? null,
      attendees: Array.isArray(args.attendees) ? args.attendees : null,
      allDay: args.allDay ?? null,
    };
  }

  return null;
}

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

  const usage = await checkAndIncrementUsage(session.user.id, userEmail);
  if (!usage.allowed) {
    return new Response(
      JSON.stringify({ error: "rate_limited", count: usage.count, limit: usage.limit }),
      { status: 429, headers: { "Content-Type": "application/json" } },
    );
  }

  const now = new Date();

  const systemPrompt = `You are Tsunagu AI — the personal Gmail and Google Calendar assistant for ${userName} (${userEmail}).
Current date and time: ${now.toDateString()}, ${now.toLocaleTimeString()} IST.

Your only job is to help ${userName} manage their Gmail and Google Calendar. Nothing else.

════════════════════════════════════════════
RULE 1 — ONE ACTION PER TURN (CRITICAL)
════════════════════════════════════════════
Every response is exactly ONE of:
  A) Ask a question  →  no tool calls, no statements
  B) Call a tool     →  no text before the call, no questions
  C) Write a reply   →  based only on data already returned by a prior tool call

NEVER mix these. Never say "Let me check…" or "Sure!" before a tool call — just call the tool.
Never ask a question AND call a tool in the same turn.
After a tool returns, write the answer directly — do not re-ask any question you already asked.
Short affirmatives from the user after you asked for confirmation ("yes", "sure", "go ahead",
"do it", "yep", "ok", "please", "sounds good") → execute immediately without re-summarising.

════════════════════════════════════════════
RULE 2 — NEVER GUESS OR FABRICATE DATA
════════════════════════════════════════════
Never invent email addresses, event IDs, thread IDs, message content, or calendar data.
Always fetch real data from Gmail or Google Calendar before using it.
For replies or forwards: fetch the original message first (format: 'metadata') to get the
exact From address and Message-ID. Use the real values — never guess.

════════════════════════════════════════════
RULE 3 — CONFIRM BEFORE DESTRUCTIVE ACTIONS
════════════════════════════════════════════
Destructive = trash, delete, permanently remove, bulk modify.
Always ask once: "Are you sure you want to [action]?" before executing.
On user confirmation, execute immediately — do not re-confirm.
NEVER bulk-delete, bulk-trash, or bulk-modify without explicit confirmation per batch.

════════════════════════════════════════════
RULE 4 — EMAIL CARD FLOW (NEVER SEND DIRECTLY)
════════════════════════════════════════════
For ALL email composition (compose, reply, forward, draft, "send an email"):
  → Call draft_email with complete fields. This shows an editable card in the UI.
  → The user sends or saves by clicking the card buttons. YOU never send email.
  → Never say "I've sent your email." Never call run_script to send email.
  → If the user asks for edits ("shorter", "change subject"), call draft_email again with
    the updated content.
  → Only ask clarifying questions if you are genuinely missing the recipient or the core
    message intent. If you can write a reasonable draft, call draft_email immediately.
  → The card IS the preview — do not write a separate text preview of the email content.

════════════════════════════════════════════
RULE 5 — CALENDAR CREATE FLOW
════════════════════════════════════════════
For new calendar events:
  → Show event details as formatted text and ask "Should I create this?"
  → Call create_calendar_event only after the user confirms.
  → If the user's message IS already the confirmation ("yes", "go ahead", "create it"),
    call the tool immediately.
  → Default timezone: Asia/Kolkata (IST) unless the user specifies otherwise.
  → Always pass all known fields: summary, start, end, timeZone, attendees, location,
    description, sendUpdates: 'all' when attendees are present.

════════════════════════════════════════════
SCOPE — STRICT GUARDRAILS
════════════════════════════════════════════
IN SCOPE (help with all of these):
  Gmail:
    • Read, search, and summarise emails and threads
    • Compose, draft, reply to, and forward emails (via draft card)
    • Trash, archive, star/unstar, mark read/unread, apply/remove labels
  Google Calendar:
    • List, search, and summarise events
    • Create events with attendees (Google sends invite emails automatically)
    • Update existing events (title, time, attendees, description, location)
    • Delete events (with confirmation)
    • Check free/busy availability for any time window
  Meta:
    • Explain what Tsunagu can do

OUT OF SCOPE — refuse all of these:
  Coding help, math, science, weather, news, recipes, general trivia, travel advice,
  health questions, creative writing unrelated to an email draft, or ANY topic not
  directly related to Gmail or Google Calendar.

REFUSAL — say this exactly, nothing added or removed:
  "I can only help with your Gmail and Google Calendar. Try asking about your emails or upcoming events."

════════════════════════════════════════════
TONE & STYLE
════════════════════════════════════════════
- Concise and natural. No filler ("Of course!", "Great question!", "Certainly!").
- Match the user's tone — casual if they're casual, professional if the task demands it.
- Use lists for email/event summaries. Group by date when showing multiple days.
- "Day by day" or "breakdown by day" requests → separate labelled section per date.
- Report actual tool errors — never make up a vague excuse.
- Conversation history is available — use it. Never re-fetch data you already have.

════════════════════════════════════════════
TOOL REFERENCE — run_script PATTERNS
════════════════════════════════════════════
Use run_script for all Corsair operations.
Do NOT call list_operations or get_schema before every request — only if you genuinely
don't know a specific parameter for an operation.

── GMAIL ──────────────────────────────────

// List inbox (newest first)
const msgs = await corsair.gmail.api.messages.list({ labelIds: ['INBOX'], maxResults: 20 });
return msgs.messages; // [{ id, threadId }, ...]

// Search emails (Gmail query syntax)
const results = await corsair.gmail.api.messages.list({ q: 'from:john@example.com subject:invoice is:unread', maxResults: 10 });

// Get full email including body
const msg = await corsair.gmail.api.messages.get({ id: 'MSG_ID', format: 'full' });
// Body text is decoded by Corsair — read msg.payload.parts[n].body.data directly as text.

// Get headers only — fast; use for replies/forwards
const meta = await corsair.gmail.api.messages.get({ id: 'MSG_ID', format: 'metadata' });
// Headers array: meta.payload.headers → find { name: 'From' }, { name: 'Subject' }, { name: 'Message-ID' }

// Get full thread
const thread = await corsair.gmail.api.threads.get({ id: 'THREAD_ID' });

// Trash (recoverable, moves to Trash folder)
await corsair.gmail.api.messages.trash({ id: 'MSG_ID' });

// Archive (remove from inbox, stays in All Mail)
await corsair.gmail.api.messages.modify({ id: 'MSG_ID', removeLabelIds: ['INBOX'], addLabelIds: [] });

// Mark as read
await corsair.gmail.api.messages.modify({ id: 'MSG_ID', removeLabelIds: ['UNREAD'], addLabelIds: [] });

// Mark as unread
await corsair.gmail.api.messages.modify({ id: 'MSG_ID', addLabelIds: ['UNREAD'], removeLabelIds: [] });

// Star
await corsair.gmail.api.messages.modify({ id: 'MSG_ID', addLabelIds: ['STARRED'], removeLabelIds: [] });

// Unstar
await corsair.gmail.api.messages.modify({ id: 'MSG_ID', removeLabelIds: ['STARRED'], addLabelIds: [] });

// Apply a label (must use label ID not name — fetch labels first)
const labels = await corsair.gmail.api.labels.list({});
// Then find the label ID and:
await corsair.gmail.api.messages.modify({ id: 'MSG_ID', addLabelIds: ['Label_123'], removeLabelIds: [] });

── CALENDAR ───────────────────────────────

// List upcoming events (next 7 days)
const evts = await corsair.googlecalendar.api.events.getMany({
  calendarId: 'primary',
  timeMin: new Date().toISOString(),
  timeMax: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  singleEvents: true,
  orderBy: 'startTime'
});

// Search events by keyword
const evts = await corsair.googlecalendar.api.events.getMany({
  calendarId: 'primary',
  q: 'standup',
  timeMin: new Date().toISOString(),
  singleEvents: true,
  orderBy: 'startTime'
});

// Get single event by ID
const evt = await corsair.googlecalendar.api.events.get({ calendarId: 'primary', id: 'EVENT_ID' });

// Update event (pass the full updated event object)
const updated = await corsair.googlecalendar.api.events.update({
  id: 'EVENT_ID',
  calendarId: 'primary',
  event: {
    summary: 'New Title',
    start: { dateTime: '2026-06-20T10:00:00+05:30', timeZone: 'Asia/Kolkata' },
    end:   { dateTime: '2026-06-20T11:00:00+05:30', timeZone: 'Asia/Kolkata' },
    attendees: [{ email: 'colleague@example.com' }],
    description: 'Updated notes',
    sendUpdates: 'all'
  }
});

// Delete event — always confirm with user first
await corsair.googlecalendar.api.events.delete({ calendarId: 'primary', id: 'EVENT_ID' });

// Check availability (list events in a specific window)
const busy = await corsair.googlecalendar.api.events.getMany({
  calendarId: 'primary',
  timeMin: '2026-06-20T00:00:00+05:30',
  timeMax: '2026-06-20T23:59:59+05:30',
  singleEvents: true,
  orderBy: 'startTime'
});

── COMPOSITION TOOLS ──────────────────────

draft_email (MANDATORY for all email composition — compose, reply, forward, draft, send)
  Params: to (string), subject (string), body (string), cc? (string)
  For replies: include inReplyTo with the Message-ID header value of the original message.
  For forwards: prefix subject with "Fwd: ", quote original body in the body field.
  Never call send_email or run_script to send. The user sends via the card button.

create_calendar_event (MANDATORY for event creation — call only after user confirms)
  Params: summary, start (ISO 8601 string), end (ISO 8601 string), timeZone (IANA),
          attendees? (string[]), location?, description?, allDay? (boolean),
          sendUpdates? ('all' | 'none')
  Set sendUpdates: 'all' whenever attendees are present so Google emails them the invite.`;

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

  // draft_email — shows an editable preview card. Does NOT write to Gmail.
  // Actual saving/sending is an explicit user action via the card buttons.
  const draftEmailTool = tool({
    name: "draft_email",
    description: `Surface an editable email draft card in the chat for ${userName} to review. Call this ONLY when the user explicitly asks to save a draft. Does NOT send or save to Gmail — the user must click the card buttons to do that.`,
    parameters: z.object({
      to: z.string().describe("Recipient email address"),
      subject: z.string().describe("Email subject line"),
      body: z.string().describe("Plain text email body"),
    }),
    execute: async ({ to, subject }) => {
      return JSON.stringify({ preview: true, to, subject, note: "Draft card shown to user for review." });
    },
  });

  // Custom create_calendar_event tool — creates an event with full structured detail
  const createEventTool = tool({
    name: "create_calendar_event",
    description: "Create a Google Calendar event on the user's primary calendar. Provide complete details so the user can review exactly what was scheduled.",
    parameters: z.object({
      summary: z.string().describe("Event title"),
      start: z.string().describe("Start datetime in ISO 8601, e.g. 2026-06-16T09:00:00 (or 2026-06-16 for all-day)"),
      end: z.string().describe("End datetime in ISO 8601 (or date for all-day)"),
      timeZone: z.string().nullable().describe("IANA timezone e.g. Asia/Kolkata. Default to Asia/Kolkata (IST) unless the user specifies a different timezone."),
      location: z.string().nullable().describe("Event location, or null"),
      description: z.string().nullable().describe("Event description/notes, or null"),
      attendees: z.array(z.string()).nullable().describe("Attendee email addresses, or null"),
      allDay: z.boolean().nullable().describe("True for an all-day event, otherwise false/null"),
    }),
    execute: async ({ summary, start, end, timeZone, location, description, attendees, allDay }) => {
      const tz = timeZone || "Asia/Kolkata";
      const startObj = allDay ? { date: start.split("T")[0] } : { dateTime: start, timeZone: tz };
      const endObj = allDay ? { date: end.split("T")[0] } : { dateTime: end, timeZone: tz };
      const event: Record<string, unknown> = { summary, start: startObj, end: endObj };
      if (location) event.location = location;
      if (description) event.description = description;
      if (attendees && attendees.length) event.attendees = attendees.map((email) => ({ email }));
      const created = await tenant.googlecalendar.api.events.create({
        calendarId: "primary",
        event,
        sendUpdates: "all",
      });
      return JSON.stringify({ success: true, id: created.id, htmlLink: created.htmlLink });
    },
  });

  const agent = new Agent({
    name: "tsunagu-agent",
    instructions: systemPrompt,
    tools: [...corsairTools, draftEmailTool, createEventTool],
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
        const artifacts: ChatArtifact[] = [];
        // Map callId → parsed args for calendar events (correlated via tool_output)
        const pendingEventArgs = new Map<string, any>();

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
              const item = event.item as any;
              const rawItem = item.rawItem;
              const toolName: string = item.toolName ?? rawItem?.name ?? "tool";
              const callId: string = item.callId ?? "";
              if (!usedTools.includes(toolName)) usedTools.push(toolName);
              send({ tool: toolName });

              // Any pre-tool text the model emitted in this turn is transitional
              // ("let me check…"). Clear it so only the post-tool answer shows.
              if (fullText.trim()) {
                fullText = "";
                send({ text_reset: true });
              }

              // Email card — built from args at call time so the card appears immediately.
              if (toolName === "draft_email") {
                const artifact = buildArtifact(toolName, rawItem?.arguments);
                if (artifact) {
                  artifacts.push(artifact);
                  send({ artifact });
                }
              }

              // Calendar event args are stored here; card is sent in tool_output
              // once we have the real event ID returned by the Google API.
              if (toolName === "create_calendar_event" && callId) {
                try {
                  pendingEventArgs.set(callId, JSON.parse(rawItem?.arguments ?? "{}"));
                } catch {}
              }
            }

            if (event.name === "tool_output") {
              const item = event.item as any;
              const callId: string = item.callId ?? "";
              if (pendingEventArgs.has(callId)) {
                const args = pendingEventArgs.get(callId)!;
                pendingEventArgs.delete(callId);
                let result: any = {};
                try { result = JSON.parse(item.output ?? "{}"); } catch {}
                const artifact: ChatArtifact = {
                  kind: "event",
                  summary: args.summary ?? "(No title)",
                  start: args.start ?? null,
                  end: args.end ?? null,
                  timeZone: args.timeZone ?? null,
                  location: args.location ?? null,
                  description: args.description ?? null,
                  attendees: Array.isArray(args.attendees) ? args.attendees : null,
                  allDay: args.allDay ?? null,
                  eventId: result.id ?? null,
                  htmlLink: result.htmlLink ?? null,
                };
                artifacts.push(artifact);
                send({ artifact });
              }
            }
          }
        }

        // Persist assistant reply to DB
        if (sessionId && fullText) {
          const baseValues = {
            id: crypto.randomUUID(),
            sessionId,
            userId: session.user.id,
            role: "assistant" as const,
            content: fullText || "Done.",
            toolsUsed: usedTools.length > 0 ? usedTools : null,
            createdAt: new Date(),
          };
          try {
            await db.insert(chatMessages).values({
              ...baseValues,
              artifacts: artifacts.length > 0 ? artifacts : null,
            });
          } catch {
            // Older DBs may not have the `artifacts` column yet — never let
            // that break message persistence.
            await db.insert(chatMessages).values(baseValues);
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

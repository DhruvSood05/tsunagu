export const maxDuration = 60;

import { Agent, run, tool } from "@openai/agents";
import { OpenAIAgentsProvider } from "@corsair-dev/mcp";
import { corsair, db } from "@/db";
import { chatMessages, chatSessions, aiUsage } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
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

  // Rate limiting: 10 AI requests/day for all users except the owner
  const FREE_TIER_LIMIT = 10;
  const isOwner = userEmail === "dhruvsood1102@gmail.com";
  if (!isOwner) {
    const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" }); // YYYY-MM-DD IST
    const [usage] = await db
      .select({ requestCount: aiUsage.requestCount })
      .from(aiUsage)
      .where(and(eq(aiUsage.userId, session.user.id), eq(aiUsage.date, today)));
    const count = usage?.requestCount ?? 0;
    if (count >= FREE_TIER_LIMIT) {
      return new Response(
        JSON.stringify({ error: "rate_limited", count, limit: FREE_TIER_LIMIT }),
        { status: 429, headers: { "Content-Type": "application/json" } }
      );
    }
    await db
      .insert(aiUsage)
      .values({ userId: session.user.id, date: today, requestCount: 1 })
      .onConflictDoUpdate({
        target: [aiUsage.userId, aiUsage.date],
        set: { requestCount: sql`${aiUsage.requestCount} + 1` },
      });
  }

  const now = new Date();

  const systemPrompt = `You are Tsunagu AI — the personal email and calendar assistant for ${userName} (${userEmail}). Today is ${now.toDateString()}, ${now.toLocaleTimeString()}.

Your role is to help the user manage their Gmail and Google Calendar through natural conversation. Follow these rules precisely.

---

TONE AND CONVERSATIONAL STYLE
- Talk like a thoughtful friend, not a corporate bot. Be warm, natural, and concise.
- Mirror the user's communication style. If they're casual and brief, match that. If they write formally, match that too.
- Be professional when the task calls for it — e.g. drafting a work email — even if the user's message to you is casual. Read the situation.
- Don't over-explain or pad responses. Say what's useful, then stop.

ASKING FOLLOW-UP QUESTIONS
- Before drafting or scheduling, make sure you have what you actually need. Ask focused follow-up questions when key details are missing or ambiguous.
- For emails: confirm recipient, subject, core message/intent, tone, and whether to send or just draft. Don't ask for things you can reasonably infer — only ask about genuine gaps.
- For calendar: clarify date, time, duration, attendees, title, location/video link — only the ones that are actually unclear.
- Ask one clear question at a time, or group a few tightly related ones. Never repeat the same question twice.
- Phrase follow-ups conversationally, like a friend double-checking, not like a form.

EMAIL PREVIEW — THE CARD IS THE PREVIEW
- Whenever the user asks to write, compose, draft, reply to, or send an email — call draft_email with the full content. This surfaces an editable card in the chat where the user can modify any field and then click "Send Email" or "Save as Draft".
- The card IS the preview. Do NOT show a separate text preview of an email. Just call draft_email.
- If the user asks for edits ("change the subject", "make it shorter") — call draft_email again with the updated content. The new card replaces the old one visually.
- Never say "I've sent your email" or imply the email was sent. The card buttons are the user's explicit send/save actions — you do not send email yourself.
- Only ask follow-up questions if key details are genuinely missing (recipient, core intent). If you have enough to write a good draft, just call draft_email.

CALENDAR PREVIEW — CONFIRM BEFORE CREATING
- For calendar events: show the event details as formatted text first and ask "Should I create this?" before calling create_calendar_event.
- Only call create_calendar_event after the user confirms. The event card that appears lets them edit and update after creation.
- Exception: if the user's message is already a confirmation of details you just showed ("yes", "go ahead", "do it", "create it"), call the tool immediately.

GENERAL RULES
- Keep the user in control at every step. They should always be able to change anything before it leaves the chat.
- You have the full conversation history. Use it. Never repeat a question you already asked.
- When the user replies with a short affirmative after a preview ("yes", "sure", "go ahead", "please", "ok", "yep", "do it") — execute immediately. Do NOT re-summarise or re-ask.
- When the user asks for a "day by day" or "breakdown by day" view: group data by calendar date with a separate section per day. Do NOT bold dates inline in a flat paragraph.
- Always move the conversation forward. If you already fetched data, don't re-fetch unless the user asks.
- Always fetch real data before answering questions about emails or calendar.

SCOPE
- In scope: reading, searching, summarising emails; composing, drafting, replying, forwarding, sending emails; scheduling meetings; listing, creating, updating, deleting calendar events; checking availability; casual conversation and small talk.
- Out of scope (refuse only these): coding help, math problems, science explanations, weather, news, restaurant/product recommendations, poems or stories unrelated to an email draft.
- When refusing out-of-scope tasks, say exactly: "I can only help with your Gmail and Google Calendar. Try asking about your emails or upcoming events."

---

TECHNICAL TOOL USAGE — READ CAREFULLY

HOW TO USE CORSAIR TOOLS:
- Use run_script to execute Corsair operations directly. You already know what's available — do NOT call list_operations or get_schema before every request. Only call them if you genuinely don't know a specific operation's parameters.
- run_script example:
   const msgs = await corsair.gmail.api.messages.list({ labelIds: ['INBOX'], maxResults: 10 });
   return msgs.messages;

COMMON PATTERNS:
- List inbox: corsair.gmail.api.messages.list({ labelIds: ['INBOX'], maxResults: 10 })
- Search emails: corsair.gmail.api.messages.list({ q: 'query here', maxResults: 10 })
- Get email details: corsair.gmail.api.messages.get({ id: 'MESSAGE_ID', format: 'full' })
- List calendar events: corsair.googlecalendar.api.events.getMany({ calendarId: 'primary', timeMin: '...ISO...', timeMax: '...ISO...', singleEvents: true, orderBy: 'startTime' })
- Delete a calendar event: corsair.googlecalendar.api.events.delete({ calendarId: 'primary', id: 'EVENT_ID' })

EMAIL TOOL (MANDATORY — never use run_script for email):
- draft_email: use this for ALL email composition — writing, composing, drafting, replying, sending. It shows an editable card. The user clicks the card buttons to send or save. NEVER use run_script for email. NEVER call send_email (it doesn't exist).
- CRITICAL for replies: first fetch the original message via run_script (corsair.gmail.api.messages.get({ id: '...', format: 'metadata' })) to get the exact "From" address. Use that as the "to" field. NEVER guess email addresses.

CALENDAR TOOL (MANDATORY — never use run_script for event creation):
- create_calendar_event: call after the user confirms the event details. Default timezone is Asia/Kolkata (IST) unless the user specifies otherwise. Pass all details so the review card is complete.`;

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
        // Track whether we're starting a fresh post-tool model turn
        let needsTextReset = false;

        for await (const event of streamedResult) {
          if (event.type === "raw_model_stream_event") {
            const data = event.data as any;
            if (data?.type === "output_text_delta" && data?.delta) {
              if (needsTextReset) {
                // Discard text from the previous pre-tool turn and start fresh
                fullText = "";
                send({ text_reset: true });
                needsTextReset = false;
              }
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
              // Signal that the next text delta begins a new model turn
              needsTextReset = true;
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

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
import Supermemory from "supermemory";

const supermemory = process.env.SUPERMEMORY_API_KEY ? new Supermemory() : null;

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

  const systemPrompt = `You are Tsunagu AI, the personal Gmail and Google Calendar assistant for ${userName} (${userEmail}).
Current date/time: ${now.toDateString()}, ${now.toLocaleTimeString()} IST.
User timezone: Asia/Kolkata (IST, UTC+5:30).

You have FULL READ AND WRITE ACCESS to ${userName}'s Gmail and Google Calendar.
Your only job is to help manage those two services. Nothing else.

════════════════════════════════════════════
RULE 1 - ONE ACTION PER TURN
════════════════════════════════════════════
Every response is exactly ONE of:
  A) Ask a question  ->  no tool call in the same response
  B) Call a tool     ->  no text before the call, no question in the same response
  C) Answer          ->  only after a tool already returned data this turn

Never say "Let me check" or "Sure!" before a tool call - just call it immediately.
After a tool returns, answer directly - never re-ask something you already asked.
Short affirmatives ("yes", "sure", "go ahead", "do it", "yep", "ok", "please",
"sounds good", "send it", "now send it", "send") -> act immediately, no re-summary.

════════════════════════════════════════════
RULE 2 - NEVER GUESS, ALWAYS FETCH
════════════════════════════════════════════
Never invent email addresses, IDs, subjects, bodies, or calendar data.
If you need information - fetch it. You have full API access; use it freely.

REPLIES / FORWARDS - fetch first, then draft:
  Step 1: run_script -> messages.get({ id, format: 'full' })
  Step 2: extract From, To, Subject, Message-ID from payload.headers
  Step 3: draft_email({ to: <From value>, subject: 'Re: <Subject>', body, inReplyTo: <Message-ID> })

FOLLOW-UP ON SENT MAIL:
  Step 1: run_script -> messages.list({ labelIds: ['SENT'], maxResults: 5 })
  Step 2: run_script -> messages.get({ id: sentList.messages[0].id, format: 'full' })
  Step 3: extract To (recipient), Subject, Message-ID from payload.headers
  Step 4: draft_email({ to: <To value>, subject: 'Follow-up: <Subject>', body, inReplyTo: <Message-ID> })
  NEVER say "I can't find the recipient" - it is always in the To header of the sent message.

NEVER use ${userEmail} as the reply recipient. That is the sender's own address.
  -> Replies to received mail: use the From header
  -> Follow-ups to sent mail: use the To header

════════════════════════════════════════════
RULE 3 - CONFIRM BEFORE DESTRUCTIVE ACTIONS
════════════════════════════════════════════
Destructive = trash, delete, permanently remove, bulk modify.
Ask once: "Are you sure?" -> execute on confirmation.
Read, search, list, summarise -> never require confirmation, just do it immediately.

════════════════════════════════════════════
RULE 4 - EMAIL DRAFT -> SEND FLOW
════════════════════════════════════════════
ALL email composition (new, reply, forward, follow-up) goes through two steps:

STEP 1 - call draft_email:
  -> Always call this first. Shows an editable card the user can review/edit.
  -> After card: say "Here's your draft - make changes or say 'send it' to send."

STEP 2 - when user confirms, call send_email:
  -> Trigger: "send it", "send this", "now send it", "go ahead", "send", "yes send"
  -> Read the [DRAFT_EMAIL to="..." subject="..." body="..."] marker from history.
  -> Call send_email with those exact values.
  -> After success: say "Sent! checkmark" - nothing else.
  -> NEVER refuse "send it" - it is always a valid action.

Edit requests ("make it shorter", "change the subject", "different tone", "make it longer", "300 words", "more formal"):
  -> FULLY REWRITE the body to satisfy the request. Do NOT reuse the old body unchanged.
  -> "in 300 words" / "make it 300 words" / "keep it to 300 words" = write a complete body of ~300 words.
  -> Length changes require you to actually write the new content — do not output a placeholder or the old text.
  -> Call draft_email again with the fully updated fields. Show new card. Do not ask first.

════════════════════════════════════════════
RULE 5 - CALENDAR EVENT FLOW
════════════════════════════════════════════
Creating events:
  -> If details are incomplete, ask ONE question to fill them in.
  -> Once you have enough: summarise and ask "Should I create this?"
  -> On confirmation (or if user already implies it): call create_calendar_event immediately.
  -> Default timezone: Asia/Kolkata. Set sendUpdates: 'all' when attendees are present.

Updating events:
  -> Fetch the event ID first via events.getMany, then call events.update.

Deleting events:
  -> Always confirm once before calling events.delete.

════════════════════════════════════════════
SCOPE
════════════════════════════════════════════
IN SCOPE - always help, never refuse:
  Gmail: read/list/search/summarise, compose/reply/forward/draft/send,
         trash/delete/archive, star/unstar, mark read/unread, labels, attachments
  Calendar: list/search events, create/update/delete, invite attendees, check availability
  Always in scope: "send it", "reply", "forward", "draft", "check my email",
  "what's on my calendar", "create an event", "delete this", "what did X send me"

OUT OF SCOPE - refuse only:
  Coding, math, science, weather, news, recipes, trivia, travel, health.

REFUSAL (exact text only for truly off-topic):
  "I can only help with your Gmail and Google Calendar."

════════════════════════════════════════════
TONE & FORMAT
════════════════════════════════════════════
- Concise and natural. No filler ("Of course!", "Great!", "Certainly!").
- Bullet lists for email/event summaries. Group by date for multi-day views.
- Always report real errors - never invent vague excuses.
- Use conversation history - never re-fetch data already retrieved this session.
- For lists of emails/events: show sender/title, date, and one-line summary.

════════════════════════════════════════════
FULL API REFERENCE - run_script PATTERNS
════════════════════════════════════════════
Use run_script for ALL Gmail and Calendar API calls.
Do NOT call list_operations or get_schema - you already know the full API below.
Write complete self-contained scripts in each run_script call.

== GMAIL: LIST / SEARCH ==

  // Inbox (IDs only - always fetch content in a second call)
  const list = await corsair.gmail.api.messages.list({ labelIds: ['INBOX'], maxResults: 20 });
  // list.messages = [{ id, threadId }, ...]  OR  undefined if empty

  // Any label: 'INBOX', 'SENT', 'DRAFTS', 'STARRED', 'IMPORTANT', 'SPAM', 'TRASH'
  const sent = await corsair.gmail.api.messages.list({ labelIds: ['SENT'], maxResults: 10 });

  // Search with Gmail query operators
  const results = await corsair.gmail.api.messages.list({
    q: 'from:sanjay@example.com subject:meeting is:unread after:2024/01/01',
    maxResults: 10
  });
  // Query operators: from: to: subject: has:attachment is:unread is:starred
  //   label: after: before: newer_than: older_than: in:sent in:inbox

== GMAIL: READ A MESSAGE ==

  const msg = await corsair.gmail.api.messages.get({ id: 'MSG_ID', format: 'full' });
  // msg.id, msg.threadId, msg.snippet (short preview, always present)
  // msg.payload.headers = [{ name, value }] - always present
  //   key headers: 'From', 'To', 'Cc', 'Subject', 'Date', 'Message-ID', 'In-Reply-To'
  // msg.payload.body.data = base64url body (simple messages)
  // msg.payload.parts = array of parts (multipart messages)

  // Helper to extract plain-text body:
  function getBody(msg) {
    const data = msg.payload?.body?.data
      || msg.payload?.parts?.find(p => p.mimeType === 'text/plain')?.body?.data
      || msg.payload?.parts?.flatMap(p => p.parts || []).find(p => p.mimeType === 'text/plain')?.body?.data;
    return data ? Buffer.from(data, 'base64').toString('utf-8') : msg.snippet || '';
  }

  // Fetch and summarise multiple messages in one script:
  const list = await corsair.gmail.api.messages.list({ labelIds: ['INBOX'], maxResults: 5 });
  if (!list.messages?.length) return 'Inbox is empty.';
  const msgs = await Promise.all(list.messages.map(m =>
    corsair.gmail.api.messages.get({ id: m.id, format: 'full' })
  ));
  return msgs.map(m => ({
    id: m.id,
    threadId: m.threadId,
    from:      m.payload.headers.find(h => h.name === 'From')?.value,
    to:        m.payload.headers.find(h => h.name === 'To')?.value,
    subject:   m.payload.headers.find(h => h.name === 'Subject')?.value,
    date:      m.payload.headers.find(h => h.name === 'Date')?.value,
    messageId: m.payload.headers.find(h => h.name === 'Message-ID')?.value,
    snippet:   m.snippet,
  }));

== GMAIL: REPLY / FORWARD - full pattern ==

  // Step 1: fetch the original message (format: 'full' gives headers + body)
  const orig = await corsair.gmail.api.messages.get({ id: 'MSG_ID', format: 'full' });
  const h = orig.payload.headers;
  const replyTo  = h.find(x => x.name === 'From')?.value;       // recipient for reply
  const subject  = h.find(x => x.name === 'Subject')?.value;    // prefix 'Re: '
  const msgId    = h.find(x => x.name === 'Message-ID')?.value; // for threading
  return { replyTo, subject, msgId };
  // Step 2: call draft_email with the extracted values (never guess these)
  // draft_email({ to: replyTo, subject: 'Re: ' + subject, body: '...', inReplyTo: msgId })

== GMAIL: FOLLOW-UP ON SENT MAIL - full pattern ==

  // Step 1: list sent messages
  const sentList = await corsair.gmail.api.messages.list({ labelIds: ['SENT'], maxResults: 10 });
  if (!sentList.messages?.length) return 'No sent messages found.';
  // Step 2: fetch the specific sent message
  const sent = await corsair.gmail.api.messages.get({ id: sentList.messages[0].id, format: 'full' });
  const sh = sent.payload.headers;
  const sentTo      = sh.find(x => x.name === 'To')?.value;          // the original recipient
  const sentSubject = sh.find(x => x.name === 'Subject')?.value;
  const sentMsgId   = sh.find(x => x.name === 'Message-ID')?.value;
  return { sentTo, sentSubject, sentMsgId };
  // Step 3: draft_email with extracted values - NEVER use ${userEmail} as recipient
  // draft_email({ to: sentTo, subject: 'Follow-up: ' + sentSubject, body: '...', inReplyTo: sentMsgId })

== GMAIL: THREADS ==

  // Read full conversation (oldest message first)
  const thread = await corsair.gmail.api.threads.get({ id: 'THREAD_ID' });
  // thread.messages = full array of message objects

  // List threads
  const threads = await corsair.gmail.api.threads.list({ labelIds: ['INBOX'], maxResults: 10 });
  // threads.threads = [{ id, historyId, snippet }]

== GMAIL: MODIFY ==

  await corsair.gmail.api.messages.trash({ id: 'MSG_ID' });                                       // move to trash
  await corsair.gmail.api.messages.untrash({ id: 'MSG_ID' });                                     // restore from trash
  await corsair.gmail.api.messages.delete({ id: 'MSG_ID' });                                      // permanent delete (confirm first)
  await corsair.gmail.api.messages.modify({ id: 'MSG_ID', removeLabelIds: ['INBOX'] });           // archive
  await corsair.gmail.api.messages.modify({ id: 'MSG_ID', removeLabelIds: ['UNREAD'] });          // mark read
  await corsair.gmail.api.messages.modify({ id: 'MSG_ID', addLabelIds: ['UNREAD'] });             // mark unread
  await corsair.gmail.api.messages.modify({ id: 'MSG_ID', addLabelIds: ['STARRED'] });            // star
  await corsair.gmail.api.messages.modify({ id: 'MSG_ID', removeLabelIds: ['STARRED'] });        // unstar
  await corsair.gmail.api.messages.modify({ id: 'MSG_ID', addLabelIds: ['IMPORTANT'] });          // mark important
  // Batch modify multiple messages at once:
  await corsair.gmail.api.messages.batchModify({ ids: ['ID1','ID2'], removeLabelIds: ['UNREAD'] });

== GMAIL: DRAFTS ==

  // List drafts saved in Gmail
  const drafts = await corsair.gmail.api.drafts.list({ maxResults: 10 });
  // Get a specific draft
  const draft = await corsair.gmail.api.drafts.get({ id: 'DRAFT_ID', format: 'full' });

== GMAIL: LABELS ==

  // List all labels (system + user-created)
  const labels = await corsair.gmail.api.labels.list();
  // labels.labels = [{ id, name, type }] - use id when applying to messages

  // Create a new label
  const newLabel = await corsair.gmail.api.labels.create({
    name: 'MyLabel', labelListVisibility: 'labelShow', messageListVisibility: 'show'
  });

== GMAIL: PROFILE ==

  const profile = await corsair.gmail.api.users.getProfile();
  // profile.emailAddress, profile.messagesTotal, profile.threadsTotal

== CALENDAR: LIST EVENTS ==

  // Upcoming 7 days
  const evts = await corsair.googlecalendar.api.events.getMany({
    calendarId: 'primary',
    timeMin: new Date().toISOString(),
    timeMax: new Date(Date.now() + 7 * 86400000).toISOString(),
    singleEvents: true,
    orderBy: 'startTime',
    maxResults: 25,
  });
  // evts.items = [{ id, summary, start, end, location, description, attendees, htmlLink, status }]
  // start.dateTime (timed events) or start.date (all-day events)

  // Today only
  const todayStart = new Date(); todayStart.setHours(0,0,0,0);
  const todayEnd   = new Date(); todayEnd.setHours(23,59,59,999);
  const today = await corsair.googlecalendar.api.events.getMany({
    calendarId: 'primary', timeMin: todayStart.toISOString(), timeMax: todayEnd.toISOString(),
    singleEvents: true, orderBy: 'startTime'
  });

  // Search events by keyword
  const found = await corsair.googlecalendar.api.events.getMany({
    calendarId: 'primary', q: 'standup', singleEvents: true,
    timeMin: new Date().toISOString(), maxResults: 10
  });

== CALENDAR: GET / UPDATE / DELETE ==

  // Get a single event by ID
  const evt = await corsair.googlecalendar.api.events.get({ calendarId: 'primary', eventId: 'EVENT_ID' });

  // Update event
  await corsair.googlecalendar.api.events.update({
    id: 'EVENT_ID',
    calendarId: 'primary',
    event: {
      summary: 'New Title',
      start: { dateTime: '2026-06-20T10:00:00', timeZone: 'Asia/Kolkata' },
      end:   { dateTime: '2026-06-20T11:00:00', timeZone: 'Asia/Kolkata' },
      location: 'Conference Room A',
      description: 'Updated notes',
      attendees: [{ email: 'someone@example.com' }],
      sendUpdates: 'all',
    }
  });

  // Delete event (always confirm first)
  await corsair.googlecalendar.api.events.delete({ calendarId: 'primary', id: 'EVENT_ID' });

  // List all calendars the user has
  const cals = await corsair.googlecalendar.api.calendarList.list();
  // cals.items = [{ id, summary, primary, backgroundColor }]

== COMPOSITION TOOLS (not run_script) ==

  draft_email(to, subject, body, cc?, inReplyTo?)
    -> Call this first for ANY email composition (new, reply, forward, follow-up).
    -> Shows editable card in chat. Does NOT send or save automatically.

  send_email(to, subject, body, cc?)
    -> Sends immediately via Gmail API.
    -> Only call after user has seen the draft card and explicitly says to send.
    -> After success respond only: "Sent!"

  create_calendar_event(summary, start, end, timeZone, location?, description?, attendees?, allDay?, sendUpdates?)
    -> Creates event on primary calendar.
    -> Only call after user confirms.`;

  // Build Corsair meta-tools (list_operations, get_schema, run_script)
  const provider = new OpenAIAgentsProvider();
  const corsairTools = provider.build({ corsair: tenant, tool, setup: false });

  // send_email - actually sends via Gmail API. Only called after the user explicitly confirms.
  const sendEmailTool = tool({
    name: "send_email",
    description: `Send an email immediately on behalf of ${userName} via Gmail. Call this ONLY after the user has seen the draft card and explicitly says "send it", "send this", "go ahead", "now send it", or similar. Use the exact same to/subject/body from the draft_email call.`,
    parameters: z.object({
      to: z.string().describe("Recipient email address"),
      subject: z.string().describe("Email subject line"),
      body: z.string().describe("Plain text email body"),
      cc: z.string().optional().describe("CC recipients, comma-separated"),
    }),
    execute: async ({ to, subject, body, cc }) => {
      const raw = await buildRawEmail({ from: userEmail, to, cc: cc || undefined, subject, text: body });
      const result = await tenant.gmail.api.messages.send({ raw });
      return JSON.stringify({ success: true, messageId: result.id, to, subject });
    },
  });

  // draft_email - shows an editable preview card. Does NOT write to Gmail.
  // Actual saving/sending is an explicit user action via the card buttons.
  const draftEmailTool = tool({
    name: "draft_email",
    description: `Surface an editable email draft card in the chat for ${userName} to review and then send or save. Use this for ALL email composition - new emails, replies, forwards, and any time the user asks to send or draft an email. Does NOT send or save automatically - the user clicks the card buttons.`,
    parameters: z.object({
      to: z.string().describe("Recipient email address (for replies: use the From header of the original, never the user's own email)"),
      subject: z.string().describe("Email subject line"),
      body: z.string().describe("Plain text email body"),
      cc: z.string().optional().describe("CC recipients, comma-separated"),
      inReplyTo: z.string().optional().describe("Message-ID header of the email being replied to, for threading"),
    }),
    execute: async ({ to, subject, cc, inReplyTo }) => {
      return JSON.stringify({ preview: true, to, subject, cc, inReplyTo, note: "Draft card shown to user for review." });
    },
  });

  // Custom create_calendar_event tool - creates an event with full structured detail
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

  // Fetch relevant long-term memories from Supermemory to inject as context
  let memoryContext = "";
  if (supermemory) {
    try {
      const latestUserMsg = messages.filter((m) => m.role === "user").at(-1)?.content ?? "";
      const memResult = await (supermemory.search as any).memories({
        q: latestUserMsg,
        containerTag: `user:${session.user.id}`,
      });
      const hits: string[] = ((memResult as any).results ?? [])
        .map((r: any) => r.memory ?? "")
        .filter(Boolean)
        .slice(0, 8);
      if (hits.length) {
        memoryContext =
          "\n\n==== LONG-TERM MEMORY (facts recalled from past conversations) ====\n" +
          hits.map((h, i) => `${i + 1}. ${h}`).join("\n") +
          "\n===================================================================\n";
      }
    } catch {}
  }

  const agent = new Agent({
    name: "tsunagu-agent",
    instructions: systemPrompt + memoryContext,
    tools: [...corsairTools, draftEmailTool, sendEmailTool, createEventTool],
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
        // Map callId -> parsed args for calendar events (correlated via tool_output)
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
              // ("let me check..."). Clear it so only the post-tool answer shows.
              if (fullText.trim()) {
                fullText = "";
                send({ text_reset: true });
              }

              // Email card - built from args at call time so the card appears immediately.
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
            // Older DBs may not have the `artifacts` column yet - never let
            // that break message persistence.
            await db.insert(chatMessages).values(baseValues);
          }
        }

        send({ done: true });

        // Store this exchange to Supermemory for future context
        if (supermemory && fullText) {
          try {
            const userMsg = messages.filter((m) => m.role === "user").at(-1)?.content ?? "";
            await supermemory.documents.add({
              content: `User: "${userMsg}"\nAssistant: "${fullText.slice(0, 600)}"`,
              containerTag: `user:${session.user.id}`,
            } as any);
          } catch {}
        }
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

import { corsair } from "@/db";
import { getSessionCached } from "@/lib/session-cache";
import { decodeEmailBody, getHeader } from "@/lib/email";
import { checkAndIncrementUsage } from "@/lib/ai-rate-limit";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await getSessionCached(await headers());
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const usage = await checkAndIncrementUsage(session.user.id, session.user.email ?? "");
  if (!usage.allowed) {
    return NextResponse.json(
      { error: "rate_limited", count: usage.count, limit: usage.limit },
      { status: 429 },
    );
  }

  try {
    const { emailId } = await req.json();
    if (!emailId) {
      return NextResponse.json({ error: "Missing emailId" }, { status: 400 });
    }

    const tenant = corsair.withTenant(session.user.id);
    const message = await tenant.gmail.api.messages.get({ id: emailId, format: "full" });

    if (!message) {
      return NextResponse.json({ error: "Email not found" }, { status: 404 });
    }

    const subject = getHeader(message, "Subject");
    const from = getHeader(message, "From");
    const { content } = decodeEmailBody(message);

    // Limit body size sent to LLM to prevent token bloat
    const truncatedBody = content.slice(0, 4000);

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      // Return a basic fallback if key is missing
      return NextResponse.json({
        summary: `Email from ${from} regarding "${subject}".`,
        priority: "medium",
        category: "Updates",
        followUp: false,
        followUpReason: null,
        suggestedReplies: [
          { label: "Acknowledge", draftPrompt: "Acknowledge receipt of the email." },
          { label: "Reply Yes", draftPrompt: "Reply positively to the sender." },
          { label: "Ask for Info", draftPrompt: "Ask for more information or details." }
        ]
      });
    }

    const systemPrompt = `You are an elite productivity email assistant for a premium SaaS workspace.
Analyze the provided email and return a structured JSON response.

Strict response format:
{
  "summary": "A concise, single-sentence summary of the email.",
  "priority": "high" | "medium" | "low",
  "category": "Work" | "Personal" | "Updates" | "Social" | "Calendar" | "Promotions",
  "followUp": true | false,
  "followUpReason": "Short explanation of why a follow-up is needed, or null if followUp is false.",
  "suggestedReplies": [
    {
      "label": "Button Label (e.g. 'Accept Invitation' or 'Send Docs')",
      "draftPrompt": "Instructions to draft this reply (e.g. 'Draft a friendly response accepting the calendar event and saying I look forward to it.')"
    },
    {
      "label": "Button Label",
      "draftPrompt": "Instructions to draft this reply"
    },
    {
      "label": "Button Label",
      "draftPrompt": "Instructions to draft this reply"
    }
  ]
}

Ensure suggested replies have actionable labels and prompts customized to the context of the email. Keep descriptions in suggested replies clear and distinct. Output ONLY valid raw JSON.`;

    const userMessage = `SENDER: ${from}
SUBJECT: ${subject}
BODY:
${truncatedBody}`;

    const apiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage }
        ],
        response_format: { type: "json_object" },
        temperature: 0.1
      })
    });

    if (!apiRes.ok) {
      throw new Error(`OpenAI API failed: ${apiRes.statusText}`);
    }

    const apiData = await apiRes.json();
    const resultText = apiData.choices[0]?.message?.content;
    const parsedData = JSON.parse(resultText);

    return NextResponse.json(parsedData);
  } catch (err: any) {
    console.error("[analyze-email POST error]", err?.message ?? err);
    return NextResponse.json({
      summary: "Could not generate summary.",
      priority: "medium",
      category: "Updates",
      followUp: false,
      followUpReason: null,
      suggestedReplies: [
        { label: "Reply Professional", draftPrompt: "Draft a professional reply acknowledging this email." },
        { label: "Reply Friendly", draftPrompt: "Draft a friendly reply." }
      ]
    });
  }
}

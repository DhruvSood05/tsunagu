import { corsair } from "@/db";
import { getSessionCached } from "@/lib/session-cache";
import { decodeEmailBody, getHeader } from "@/lib/email";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await getSessionCached(await headers());
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { emailId, prompt } = await req.json();
    if (!emailId || !prompt) {
      return NextResponse.json({ error: "Missing emailId or prompt" }, { status: 400 });
    }

    const tenant = corsair.withTenant(session.user.id);
    const message = await tenant.gmail.api.messages.get({ id: emailId, format: "full" });

    if (!message) {
      return NextResponse.json({ error: "Email not found" }, { status: 404 });
    }

    const subject = getHeader(message, "Subject");
    const from = getHeader(message, "From");
    const { content } = decodeEmailBody(message);

    const truncatedBody = content.slice(0, 3000);
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({
        reply: `Hi,\n\nThanks for reaching out. Regarding your email about "${subject}", I received it and will follow up shortly.\n\nBest,\n${session.user.name}`
      });
    }

    const systemPrompt = `You are an elite, highly professional personal email assistant.
Draft a high-quality email reply on behalf of the user (${session.user.name ?? session.user.email}).
Follow the instructions provided in the prompt precisely.
Base your reply on the context of the email provided.
Be concise, clear, and match the tone of a modern SaaS workspace (polite, direct, warm but professional).
Output ONLY the raw email body text. Do not wrap in quotes or add markdown formatting like backticks. Do not include subject headers.`;

    const userMessage = `ORIGINAL EMAIL DETAILS:
From: ${from}
Subject: ${subject}
Body:
${truncatedBody}

REPLY INSTRUCTIONS / PROMPT:
${prompt}`;

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
        temperature: 0.7
      })
    });

    if (!apiRes.ok) {
      throw new Error(`OpenAI API failed: ${apiRes.statusText}`);
    }

    const apiData = await apiRes.json();
    const replyText = apiData.choices[0]?.message?.content?.trim();

    return NextResponse.json({ reply: replyText });
  } catch (err: any) {
    console.error("[generate-reply POST error]", err?.message ?? err);
    return NextResponse.json({ error: "Failed to generate reply" }, { status: 500 });
  }
}

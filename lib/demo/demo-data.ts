// All demo data is static — no API calls, no authentication.
// Emails follow the GmailMessage shape so existing components render them unchanged.

const BASE = new Date("2026-06-25T12:00:00Z").getTime();
const h = (hrs: number) => String(BASE - hrs * 3_600_000);
const d = (days: number) => String(BASE - days * 86_400_000);

const b64 = (s: string) => {
  try { return btoa(s); } catch { return ""; }
};

function makeEmail(
  id: string,
  from: string,
  fromEmail: string,
  subject: string,
  body: string,
  snippet: string,
  internalDate: string,
  labels: string[] = ["INBOX"],
  attachments?: { filename: string; mimeType: string }[],
): any {
  const dateObj = new Date(Number(internalDate));
  const dateStr = dateObj.toUTCString();
  return {
    id,
    threadId: id,
    snippet,
    internalDate,
    labelIds: labels,
    _gravatarUrl: undefined,
    _attachments: attachments,
    payload: {
      mimeType: "text/plain",
      headers: [
        { name: "From",    value: `${from} <${fromEmail}>` },
        { name: "To",      value: "Alex Carter <alex@demo.tsunagu.ai>" },
        { name: "Subject", value: subject },
        { name: "Date",    value: dateStr },
      ],
      body: { data: b64(body) },
    },
  };
}

// ── Demo Emails ───────────────────────────────────────────────────────────────

export const DEMO_EMAILS: any[] = [

  // ── Investor (6) ─────────────────────────────────────────────────────────

  makeEmail(
    "demo-001", "Marcus Reid", "marcus@sequoia.vc",
    "Quick follow-up after today's demo",
    `Hi Alex,

Great meeting you this afternoon. The product is genuinely impressive and the market timing feels right.

I ran it by a couple of the partners on my way back and there's real interest. Can we get on a call Thursday to discuss terms? I'm thinking somewhere in the $2–3M range at a $15M pre-money cap, but want to hear what you're thinking first.

Looking forward to continuing the conversation.

Marcus`,
    "Great meeting you this afternoon. The product is genuinely impressive...",
    h(2),
    ["INBOX", "UNREAD"],
  ),

  makeEmail(
    "demo-002", "Lena Summers", "lena@a16z.com",
    "Term sheet ready for review",
    `Alex,

Attached is our updated term sheet. We've incorporated the feedback from last week's call and aligned on the liquidation preference and pro-rata rights.

A few things to flag before you send it to counsel:
- Section 4.2 on board composition is new
- We've softened the drag-along threshold to 65% (down from 75%)

Happy to walk through it live if that's easier. Just send a calendar invite.

Best,
Lena`,
    "Attached is our updated term sheet. We have incorporated the feedback...",
    h(4),
    ["INBOX", "UNREAD"],
    [{ filename: "term-sheet-v3.pdf", mimeType: "application/pdf" }],
  ),

  makeEmail(
    "demo-003", "Horizon Ventures", "updates@horizonvc.com",
    "Monthly investor update received",
    `Hi Alex,

Thank you for sending your monthly update. We've reviewed the metrics and wanted to share a few thoughts:

- MRR growth of 18% MoM is strong, especially given the churn numbers
- The enterprise pilot pipeline looks healthy; we'd love a deeper dive on conversion timelines next month
- Keep an eye on burn rate as you scale the engineering team

Overall, things are tracking well. Keep up the momentum.

Best,
The Horizon Team`,
    "Thank you for sending your monthly update. We have reviewed the metrics...",
    d(1),
    ["INBOX"],
  ),

  makeEmail(
    "demo-004", "Peter Nguyen", "peter@angelist.co",
    "Re: Fundraising timeline",
    `Alex,

Following up on our conversation from AngelList Demo Day. I'm personally interested in participating and have a few colleagues who might want to co-invest.

What's the close date looking like? I want to make sure we're in the data room before things get crowded.

Also — can you share the latest deck? Happy to sign the NDA first.

Best,
Peter`,
    "Following up on our conversation from AngelList Demo Day. I am personally interested...",
    d(1),
    ["INBOX", "UNREAD"],
  ),

  makeEmail(
    "demo-005", "Vantage Capital", "hello@vantagecap.io",
    "Introduction: We'd love to connect",
    `Hi Alex,

I came across Tsunagu through one of our portfolio companies and have been spending time with the product.

We focus on Series A infrastructure tools and think your approach to AI-native productivity is differentiated. Would love to learn more about your roadmap and where you see the whitespace in 18 months.

Are you open to a 30-minute intro call next week?

Warm regards,
Vantage Capital`,
    "I came across Tsunagu through one of our portfolio companies and have been spending time...",
    d(2),
    ["INBOX"],
  ),

  makeEmail(
    "demo-006", "Sarah Okonkwo", "sarah@firstround.com",
    "Re: Seed round — final questions",
    `Alex,

Before we finalize the investment memo for the partners meeting, a few quick questions:

1. What's the current ARR and growth rate over the last 90 days?
2. How many enterprise customers are on annual contracts vs. monthly?
3. Are you planning a SOC 2 audit this year?

We'd love to get answers by EOD Friday so we can present on Monday.

Thanks,
Sarah`,
    "Before we finalize the investment memo for the partners meeting, a few quick questions...",
    d(3),
    ["INBOX", "STARRED"],
  ),

  // ── Customer (5) ─────────────────────────────────────────────────────────

  makeEmail(
    "demo-007", "Priya Shah", "priya@techlabs.io",
    "Loving the product — had a few questions",
    `Hi Alex,

Just wanted to say — Tsunagu has completely changed how I handle my inbox. I was spending 2+ hours a day on email and now it's more like 30 minutes.

A couple of questions:
1. Is there a way to set AI reply tone per contact? I want formal for investors, casual for my team.
2. Can I create calendar events from email threads directly?

Would love to hop on a call if you're taking product feedback calls.

Thanks,
Priya`,
    "Just wanted to say — Tsunagu has completely changed how I handle my inbox...",
    h(3),
    ["INBOX", "UNREAD"],
  ),

  makeEmail(
    "demo-008", "TechCorp Support", "support@techcorp.com",
    "Feature request: bulk email actions",
    `Hi Team,

We've been using Tsunagu for our 12-person ops team and the main thing we keep running into is the lack of bulk archiving across multiple inboxes in the team plan.

Our use case: we want to archive all newsletters across 5 team accounts in one action. Right now we have to do it one by one.

Any plans to add this? Happy to be a beta tester.

Thanks,
Jake`,
    "We have been using Tsunagu for our 12-person ops team and the main thing we keep running into...",
    d(1),
    ["INBOX"],
  ),

  makeEmail(
    "demo-009", "Daniel Moore", "daniel@buildco.dev",
    "Billing question — urgent",
    `Hi,

I was charged $499 on June 20th but I cancelled my Pro subscription on June 18th. I have the cancellation confirmation email.

Can you please issue a refund? This is the second time this has happened and I'd really appreciate it being handled quickly.

Thanks,
Daniel`,
    "I was charged $499 on June 20th but I cancelled my Pro subscription on June 18th...",
    h(5),
    ["INBOX", "UNREAD"],
  ),

  makeEmail(
    "demo-010", "Elena Rodriguez", "elena@startup.ai",
    "Thank you for the onboarding call",
    `Hi Alex,

Just a quick thank you for the onboarding call yesterday. The team walked us through everything really clearly and we're already up and running.

One small thing — the calendar sync seems to be a few minutes delayed. Is that expected or should I check our setup?

Looking forward to the product updates!

Best,
Elena`,
    "Just a quick thank you for the onboarding call yesterday. The team walked us through everything...",
    d(2),
    ["INBOX"],
  ),

  makeEmail(
    "demo-011", "Feedback Bot", "noreply@feedbackhq.com",
    "We'd love your feedback on Tsunagu",
    `Hi Alex,

You've been using Tsunagu for 30 days. We'd love to know what you think!

Completing this quick survey (3 questions, 2 minutes) helps us improve the product for you and everyone else.

Take the survey → https://feedback.tsunagu.ai/30day

Thanks for being part of our early community,
The Tsunagu Team`,
    "You have been using Tsunagu for 30 days. We would love to know what you think...",
    d(4),
    ["INBOX", "CATEGORY_PROMOTIONS"],
  ),

  // ── Recruiter (3) ────────────────────────────────────────────────────────

  makeEmail(
    "demo-012", "James Wilson", "james@toprecruit.io",
    "CTO opportunity — $300k+ comp, Series B",
    `Hi Alex,

I'm a recruiter specializing in senior technical roles and came across your background through LinkedIn.

I'm working with a Series B SaaS company (ARR $8M, 45 employees) that's looking for a CTO to lead an 18-person engineering org.

Comp package: $240k base + equity (0.8–1.2%) + performance bonus.

This is confidential. Happy to share more details if there's any interest.

Best,
James Wilson`,
    "I am a recruiter specializing in senior technical roles and came across your background...",
    h(1),
    ["INBOX", "UNREAD"],
  ),

  makeEmail(
    "demo-013", "Olivia Park", "olivia@talentsync.co",
    "Interview scheduled for Friday — Horizon AI",
    `Hi Alex,

Just confirming your interview with Horizon AI is scheduled for this Friday at 2pm EST.

Format: 45 min with the CEO, followed by 30 min panel with the leadership team.

Please have a portfolio project or case study ready to discuss. Video link will be sent Thursday.

Let me know if you need to reschedule.

Best,
Olivia`,
    "Just confirming your interview with Horizon AI is scheduled for this Friday at 2pm EST...",
    d(1),
    ["INBOX", "STARRED"],
  ),

  makeEmail(
    "demo-014", "Talent Collective", "reach@talentcollective.co",
    "Following up on our conversation",
    `Hi Alex,

Just circling back from our conversation at the Founder Summit last month.

We have a few new mandates that might fit your profile — two are pre-IPO with significant equity upside.

Would you be open to a 20-minute call this week to catch up?

Best,
The Talent Collective`,
    "Just circling back from our conversation at the Founder Summit last month...",
    d(5),
    ["INBOX"],
  ),

  // ── GitHub (4) ────────────────────────────────────────────────────────────

  makeEmail(
    "demo-015", "GitHub Security", "security@github.com",
    "[GitHub] Security advisory: lodash vulnerability",
    `A high-severity vulnerability has been identified in lodash v4.17.21 used in tsunagu/app.

Vulnerability: Prototype pollution via _.merge()
Severity: High (CVSS 7.4)
Affected version: < 4.17.21

Recommended action: Upgrade to lodash >= 4.17.22 or apply the provided patch.

View advisory and patch instructions in your repository security tab.`,
    "A high-severity vulnerability has been identified in lodash v4.17.21 used in tsunagu/app...",
    h(1),
    ["INBOX", "UNREAD"],
  ),

  makeEmail(
    "demo-016", "GitHub", "noreply@github.com",
    "[tsunagu/app] PR #142 approved — Improve API response caching",
    `Raj Patel approved your pull request.

PR #142: Improve API response caching
Branch: feat/api-cache → main
Reviewer: raj-patel

Changes: +287 -142 across 14 files

The review is complete. You can now merge this pull request.

View PR → https://github.com/tsunagu/app/pull/142`,
    "Raj Patel approved your pull request. PR #142: Improve API response caching...",
    h(6),
    ["INBOX"],
  ),

  makeEmail(
    "demo-017", "GitHub", "noreply@github.com",
    "[tsunagu/app] New issue #156: Calendar sync delay",
    `sam-torres opened a new issue.

Issue #156: Calendar sync 3-4 min delay on webhook events
Labels: bug, calendar, high-priority

Description:
After adding a new event in Google Calendar, Tsunagu takes 3-4 minutes to reflect the change. Expected behavior is under 30 seconds based on the webhook setup.

Steps to reproduce:
1. Add event in Google Calendar
2. Switch to Tsunagu calendar view
3. Event doesn't appear for several minutes

View issue → https://github.com/tsunagu/app/issues/156`,
    "sam-torres opened a new issue. Issue #156: Calendar sync 3-4 min delay on webhook events...",
    d(2),
    ["INBOX", "UNREAD"],
  ),

  makeEmail(
    "demo-018", "GitHub", "noreply@github.com",
    "[tsunagu/app] Discussion: Migrating to Drizzle v2",
    `raj-patel started a discussion.

Discussion: Should we migrate to Drizzle v2?

Drizzle v2 was released last week with breaking changes to the query builder API. Main benefits are 40% faster query generation and a new type-safe filter API.

Migration effort: ~2 days
Risk: Medium (query builder refactor)

Thoughts? Timeline?

Join the discussion → https://github.com/tsunagu/app/discussions/89`,
    "raj-patel started a discussion. Should we migrate to Drizzle v2?...",
    d(3),
    ["INBOX"],
  ),

  // ── Stripe (3) ───────────────────────────────────────────────────────────

  makeEmail(
    "demo-019", "Stripe", "receipts@stripe.com",
    "Payment received — $2,499.00",
    `You received a payment.

Amount: $2,499.00 USD
From: TechLabs Inc
Plan: Tsunagu Business Annual
Date: June 25, 2026
Transaction ID: txn_3PqR8xFjkT29Lm2U

This payment will be included in your next payout on June 28.

View in Stripe Dashboard → https://dashboard.stripe.com`,
    "You received a payment. Amount: $2,499.00 USD from TechLabs Inc...",
    h(3),
    ["INBOX", "UNREAD"],
  ),

  makeEmail(
    "demo-020", "Stripe", "noreply@stripe.com",
    "Monthly Revenue Report — June 2026",
    `Your June 2026 revenue summary is ready.

Gross Revenue: $18,240
Net Revenue: $17,328 (after fees)
MRR: $18,240
MoM Growth: +22.4%
Churn: 2.1%
New Customers: 34
Churned Customers: 4

Top plans by revenue:
1. Business Annual — $9,480
2. Pro Monthly — $5,440
3. Starter Monthly — $3,320

Full report available in your Stripe Dashboard.`,
    "Your June 2026 revenue summary is ready. Gross Revenue: $18,240...",
    d(1),
    ["INBOX"],
  ),

  makeEmail(
    "demo-021", "Stripe", "payouts@stripe.com",
    "Payout scheduled — $17,328.00 on Wednesday",
    `Your payout is scheduled.

Amount: $17,328.00 USD
Estimated arrival: Wednesday, June 25
Destination: ••••7823 (Chase Business)
Statement descriptor: TSUNAGU INC

If you have questions about this payout, visit the Stripe Help Center.`,
    "Your payout is scheduled. Amount: $17,328.00 USD estimated arrival Wednesday...",
    d(2),
    ["INBOX"],
  ),

  // ── Vercel (2) ──────────────────────────────────────────────────────────

  makeEmail(
    "demo-022", "Vercel", "noreply@vercel.com",
    "Your deployment completed successfully",
    `Deployment successful.

Project: tsunagu-app
Environment: Production
Branch: main
Commit: a3f891c — "feat: improve calendar sync latency"
Duration: 1m 42s
Status: Ready

Preview URL: https://tsunagu-app-git-main.vercel.app
Production URL: https://app.tsunagu.ai

Deployed by: alex@demo.tsunagu.ai`,
    "Deployment successful. Project: tsunagu-app, Environment: Production, Branch: main...",
    h(4),
    ["INBOX"],
  ),

  makeEmail(
    "demo-023", "Vercel", "noreply@vercel.com",
    "Build failed — action required",
    `Build failed.

Project: tsunagu-app
Environment: Preview
Branch: feat/ai-composer
Commit: 2d4c1f9 — "WIP: add AI composer"
Duration: 0m 38s
Status: Error

Error: Type error in components/ai/AIComposer.tsx
Line 142: Property 'draft' does not exist on type 'AISession'

View build logs and fix the issue to deploy.`,
    "Build failed. Project: tsunagu-app, Branch: feat/ai-composer, Type error in AIComposer...",
    d(1),
    ["INBOX", "UNREAD"],
  ),

  // ── Notion (2) ──────────────────────────────────────────────────────────

  makeEmail(
    "demo-024", "Notion", "notify@notion.so",
    "New comments on 'Product Roadmap Q3 2026'",
    `You have 3 new comments on Product Roadmap Q3 2026.

Raj Patel: "Should we move the AI composer to Q3? It's mostly done."
Sam Torres: "Agreed. Also the mobile app timeline feels optimistic."
Elena Rodriguez: "Can we add a section for the enterprise tier rollout?"

View the page → https://notion.so/product-roadmap-q3`,
    "You have 3 new comments on Product Roadmap Q3 2026. Raj Patel: Should we move the AI composer...",
    h(7),
    ["INBOX"],
  ),

  makeEmail(
    "demo-025", "Notion", "notify@notion.so",
    "Your workspace summary — this week",
    `Here's what happened in your Notion workspace this week.

Pages edited: 14
Comments: 23
New databases: 2
Team members active: 4

Most active pages:
1. Sprint 12 — Planning
2. Product Roadmap Q3 2026
3. Investor Deck v4
4. Engineering Handbook

View all activity → https://notion.so/workspace`,
    "Here's what happened in your Notion workspace this week. Pages edited: 14, Comments: 23...",
    d(3),
    ["INBOX", "CATEGORY_UPDATES"],
  ),

  // ── Google Calendar (2) ──────────────────────────────────────────────────

  makeEmail(
    "demo-026", "Google Calendar", "calendar-notification@google.com",
    "Invitation: Product Demo with Horizons Fund — Friday 3:00pm",
    `You have been invited to an event.

Product Demo with Horizons Fund
Date: Friday, June 27, 2026
Time: 3:00 PM – 4:00 PM EST
Location: Zoom (link in invite)
Organizer: marcus@horizonsfund.com

Attendees:
- Alex Carter (alex@demo.tsunagu.ai)
- Marcus Reid (marcus@horizonsfund.com)
- Priya Kapoor (priya@horizonsfund.com)

RSVP by replying to this email.`,
    "You have been invited to Product Demo with Horizons Fund — Friday June 27 at 3:00 PM...",
    h(5),
    ["INBOX", "UNREAD"],
  ),

  makeEmail(
    "demo-027", "Google Calendar", "calendar-notification@google.com",
    "Reminder: Sprint Planning — Tomorrow 10:00 AM",
    `This is a reminder for your upcoming event.

Sprint Planning — Sprint 13
Date: Tomorrow, June 26, 2026
Time: 10:00 AM – 11:30 AM EST
Location: Google Meet (link in calendar)
Organizer: raj@tsunagu.ai

Attendees: Alex Carter, Raj Patel, Sam Torres, Elena Rodriguez

Please review the sprint backlog before the meeting.`,
    "Reminder: Sprint Planning Sprint 13 — Tomorrow June 26 at 10:00 AM...",
    h(8),
    ["INBOX"],
  ),

  // ── Personal (3) ────────────────────────────────────────────────────────

  makeEmail(
    "demo-028", "Chris Patel", "chris.patel@gmail.com",
    "Dinner plans this weekend?",
    `Hey!

Are you free Saturday evening? A few of us are thinking of trying that new ramen place on Valencia that opened last month. Supposed to be really good.

Thinking around 7:30pm. Lmk if that works, otherwise we can do Sunday brunch instead.

Chris`,
    "Are you free Saturday evening? A few of us are thinking of trying that new ramen place...",
    h(9),
    ["INBOX"],
  ),

  makeEmail(
    "demo-029", "Mom", "mom@family.net",
    "Family reunion next month — dates confirmed",
    `Hi sweetheart,

Your Aunt Mara just confirmed. The family reunion is July 19-20 in Sacramento. We're renting out the park pavilion again like last year.

Can you please let me know if you'll be able to make it? Your cousin Leo is flying in from Austin, would be so nice to have the whole family together.

Love you,
Mom`,
    "Your Aunt Mara just confirmed. The family reunion is July 19-20 in Sacramento...",
    d(4),
    ["INBOX"],
  ),

  makeEmail(
    "demo-030", "Alex from College", "alex.r@gmail.com",
    "Congrats on the funding news!",
    `Dude!

Saw the TechCrunch article. Congrats on the seed round — that's huge! You've been working toward this forever. So pumped for you.

We need to celebrate. When are you in NYC next? Let me know and I'll plan something.

Alex`,
    "Saw the TechCrunch article. Congrats on the seed round that's huge! You have been working...",
    d(5),
    ["INBOX", "STARRED"],
  ),

  // ── Newsletters (3) ────────────────────────────────────────────────────

  makeEmail(
    "demo-031", "The Weekly Digest", "digest@weeklyread.io",
    "Issue #142 — AI productivity tools are eating SaaS",
    `This week's big idea: AI-native tools aren't competing with SaaS — they're replacing the workflows that SaaS was built around.

Top reads this week:
1. Why email will look radically different in 2027
2. The 10x operator: how founders are using AI to do the work of 3 people
3. Calendar as command line: scheduling intelligence is the next frontier

Plus: a deep dive on the Stripe + OpenAI partnership and what it means for fintech.

Read full issue → https://weeklyread.io/142`,
    "This week's big idea: AI-native tools aren't competing with SaaS — they're replacing workflows...",
    d(3),
    ["INBOX", "CATEGORY_PROMOTIONS"],
  ),

  makeEmail(
    "demo-032", "Paul Graham", "pg@ycombinator.com",
    "Founder Letter: The last mile of AI",
    `Something that's been on my mind:

The hardest part of AI products isn't the model. It's the last mile — the moment where AI judgment has to meet human trust.

The products that win will be the ones that figure out how to hand back control at exactly the right moment. Not too soon (annoying), not too late (dangerous).

This is the design problem of our generation.

— pg`,
    "The hardest part of AI products isn't the model. It's the last mile...",
    d(6),
    ["INBOX"],
  ),

  makeEmail(
    "demo-033", "Lenny Rachitsky", "lenny@lennysnewsletter.com",
    "5 tools every product founder should be using",
    `This week I asked 20 product founders what's actually changed about how they work.

The consensus surprised me. It wasn't AI writing tools. It was AI on top of their existing workflows — email, calendar, notes.

Top 5 tools they mentioned:
1. Tsunagu (AI email + calendar)
2. Granola (AI meeting notes)
3. Perplexity (research)
4. Linear (issues with AI triage)
5. Cursor (code with AI)

Full breakdown in the issue.`,
    "This week I asked 20 product founders what's actually changed about how they work...",
    d(7),
    ["INBOX", "CATEGORY_PROMOTIONS"],
  ),

  // ── Meeting Follow-ups (2) ──────────────────────────────────────────────

  makeEmail(
    "demo-034", "Sam Torres", "sam@tsunagu.ai",
    "Meeting notes — Product Review 6/24",
    `Hey team,

Notes from today's product review below.

Decisions made:
- Ship the calendar drag-and-drop improvement to production this week
- Push AI composer to next sprint (more testing needed)
- Design to deliver updated onboarding flow mockups by Friday

Action items:
- Alex: Update the pricing page copy
- Raj: Fix the mobile calendar layout bug
- Sam: Schedule user interviews for next week

Full notes in Notion: https://notion.so/product-review-0624

Sam`,
    "Notes from today's product review. Decisions: ship calendar drag-and-drop, push AI composer...",
    h(10),
    ["INBOX", "UNREAD"],
  ),

  makeEmail(
    "demo-035", "Raj Patel", "raj@tsunagu.ai",
    "Action items from this morning's standup",
    `Hi all,

Quick recap of this morning's standup:

Blockers:
- Raj: Waiting on design review for the new email composer
- Sam: Stripe webhook config needs updated keys

Today's focus:
- Deploy the calendar sync fix to staging
- Review PR #142 (caching improvements)
- Sync with Elena on the onboarding flow

Any questions, ping me on Slack.

Raj`,
    "Quick recap of this morning's standup. Blockers: waiting on design review for email composer...",
    d(1),
    ["INBOX"],
  ),

];

// ── Demo Calendar Events ─────────────────────────────────────────────────────

const dt = (daysOffset: number, hour: number, minute = 0): string => {
  const d = new Date("2026-06-25T00:00:00");
  d.setDate(d.getDate() + daysOffset);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
};

export const DEMO_EVENTS: any[] = [
  {
    id: "evt-001",
    summary: "Team Standup",
    description: "Daily standup with the engineering team",
    start: { dateTime: dt(0, 9, 0) },
    end:   { dateTime: dt(0, 9, 30) },
    colorId: "1",
    _calendarId: "primary",
    attendees: [
      { email: "raj@tsunagu.ai", displayName: "Raj Patel" },
      { email: "sam@tsunagu.ai", displayName: "Sam Torres" },
    ],
  },
  {
    id: "evt-002",
    summary: "Product Demo — Horizons Fund",
    description: "Demo for potential investors at Horizons Fund",
    location: "Zoom",
    start: { dateTime: dt(2, 15, 0) },
    end:   { dateTime: dt(2, 16, 0) },
    colorId: "2",
    _calendarId: "primary",
    attendees: [
      { email: "marcus@horizonsfund.com", displayName: "Marcus Reid" },
      { email: "priya@horizonsfund.com", displayName: "Priya Kapoor" },
    ],
  },
  {
    id: "evt-003",
    summary: "Sprint Planning — Sprint 13",
    description: "Plan the next two-week sprint",
    start: { dateTime: dt(1, 10, 0) },
    end:   { dateTime: dt(1, 11, 30) },
    colorId: "3",
    _calendarId: "primary",
    attendees: [
      { email: "raj@tsunagu.ai", displayName: "Raj Patel" },
      { email: "sam@tsunagu.ai", displayName: "Sam Torres" },
      { email: "elena@tsunagu.ai", displayName: "Elena Rodriguez" },
    ],
  },
  {
    id: "evt-004",
    summary: "Lunch with Chris",
    description: "Catching up over lunch",
    location: "The Plant Cafe, SF",
    start: { dateTime: dt(1, 12, 30) },
    end:   { dateTime: dt(1, 13, 30) },
    colorId: "5",
    _calendarId: "primary",
  },
  {
    id: "evt-005",
    summary: "Investor Meeting — Sequoia",
    description: "Follow-up meeting with Marcus Reid to discuss term sheet",
    location: "Sequoia Capital, Menlo Park",
    start: { dateTime: dt(1, 14, 0) },
    end:   { dateTime: dt(1, 15, 0) },
    colorId: "2",
    _calendarId: "primary",
    attendees: [
      { email: "marcus@sequoia.vc", displayName: "Marcus Reid" },
    ],
  },
  {
    id: "evt-006",
    summary: "Deep Work Block",
    description: "No meetings, focus on product roadmap",
    start: { dateTime: dt(2, 9, 0) },
    end:   { dateTime: dt(2, 12, 0) },
    colorId: "8",
    _calendarId: "primary",
  },
  {
    id: "evt-007",
    summary: "Design Review",
    description: "Review onboarding flow redesign with design team",
    start: { dateTime: dt(2, 14, 0) },
    end:   { dateTime: dt(2, 15, 0) },
    colorId: "3",
    _calendarId: "primary",
    attendees: [
      { email: "sam@tsunagu.ai", displayName: "Sam Torres" },
    ],
  },
  {
    id: "evt-008",
    summary: "Coffee Chat — Elena Rodriguez",
    description: "Intro call with potential enterprise customer",
    location: "Blue Bottle Coffee",
    start: { dateTime: dt(3, 10, 0) },
    end:   { dateTime: dt(3, 10, 45) },
    colorId: "5",
    _calendarId: "primary",
  },
  {
    id: "evt-009",
    summary: "Doctor Appointment",
    description: "Annual checkup",
    location: "UCSF Medical Center",
    start: { dateTime: dt(3, 11, 30) },
    end:   { dateTime: dt(3, 12, 30) },
    colorId: "6",
    _calendarId: "primary",
  },
  {
    id: "evt-010",
    summary: "Interview — Head of Engineering",
    description: "Final round interview for Head of Engineering role",
    start: { dateTime: dt(4, 13, 0) },
    end:   { dateTime: dt(4, 15, 0) },
    colorId: "1",
    _calendarId: "primary",
    attendees: [
      { email: "james@toprecruit.io", displayName: "James Wilson" },
    ],
  },
  {
    id: "evt-011",
    summary: "Gym",
    start: { dateTime: dt(0, 7, 0) },
    end:   { dateTime: dt(0, 8, 0) },
    colorId: "10",
    _calendarId: "primary",
  },
  {
    id: "evt-012",
    summary: "Gym",
    start: { dateTime: dt(2, 7, 0) },
    end:   { dateTime: dt(2, 8, 0) },
    colorId: "10",
    _calendarId: "primary",
  },
  {
    id: "evt-013",
    summary: "Gym",
    start: { dateTime: dt(4, 7, 0) },
    end:   { dateTime: dt(4, 8, 0) },
    colorId: "10",
    _calendarId: "primary",
  },
  {
    id: "evt-014",
    summary: "Team Standup",
    start: { dateTime: dt(1, 9, 0) },
    end:   { dateTime: dt(1, 9, 30) },
    colorId: "1",
    _calendarId: "primary",
  },
  {
    id: "evt-015",
    summary: "Team Standup",
    start: { dateTime: dt(2, 9, 0) },
    end:   { dateTime: dt(2, 9, 30) },
    colorId: "1",
    _calendarId: "primary",
  },
  {
    id: "evt-016",
    summary: "Team Standup",
    start: { dateTime: dt(3, 9, 0) },
    end:   { dateTime: dt(3, 9, 30) },
    colorId: "1",
    _calendarId: "primary",
  },
  {
    id: "evt-017",
    summary: "Weekend Trip — Napa",
    description: "Winery tour with friends",
    location: "Napa Valley, CA",
    start: { date: new Date("2026-06-27").toISOString().split("T")[0] },
    end:   { date: new Date("2026-06-29").toISOString().split("T")[0] },
    colorId: "5",
    _calendarId: "primary",
  },
  {
    id: "evt-018",
    summary: "Flight — SFO to NYC",
    description: "United Airlines UA 532 — depart 7:00 AM",
    location: "SFO Terminal 3",
    start: { dateTime: dt(7, 7, 0) },
    end:   { dateTime: dt(7, 15, 30) },
    colorId: "9",
    _calendarId: "primary",
  },
  {
    id: "evt-019",
    summary: "Board Meeting — Q2 Review",
    description: "Quarterly board meeting with investors",
    location: "First Round Capital, NYC",
    start: { dateTime: dt(7, 14, 0) },
    end:   { dateTime: dt(7, 17, 0) },
    colorId: "2",
    _calendarId: "primary",
    attendees: [
      { email: "lena@a16z.com", displayName: "Lena Summers" },
      { email: "sarah@firstround.com", displayName: "Sarah Okonkwo" },
    ],
  },
  {
    id: "evt-020",
    summary: "Alex's Birthday Dinner",
    description: "Dinner at State Bird Provisions",
    location: "State Bird Provisions, SF",
    start: { dateTime: dt(10, 19, 0) },
    end:   { dateTime: dt(10, 21, 30) },
    colorId: "4",
    _calendarId: "primary",
  },
  {
    id: "evt-021",
    summary: "1:1 with Raj",
    start: { dateTime: dt(-7, 10, 0) },
    end:   { dateTime: dt(-7, 10, 30) },
    colorId: "1",
    _calendarId: "primary",
  },
  {
    id: "evt-022",
    summary: "User Research Interviews",
    description: "3 x 45min interviews with enterprise prospects",
    start: { dateTime: dt(-6, 13, 0) },
    end:   { dateTime: dt(-6, 16, 0) },
    colorId: "3",
    _calendarId: "primary",
  },
  {
    id: "evt-023",
    summary: "Investor Call — A16z",
    description: "Intro call with Lena Summers at A16z",
    start: { dateTime: dt(-5, 11, 0) },
    end:   { dateTime: dt(-5, 12, 0) },
    colorId: "2",
    _calendarId: "primary",
  },
  {
    id: "evt-024",
    summary: "Launch Planning",
    description: "Plan the Product Hunt launch for next month",
    start: { dateTime: dt(14, 10, 0) },
    end:   { dateTime: dt(14, 12, 0) },
    colorId: "7",
    _calendarId: "primary",
  },
  {
    id: "evt-025",
    summary: "All-hands — Q3 Kickoff",
    description: "Company all-hands to kick off Q3",
    start: { dateTime: dt(5, 16, 0) },
    end:   { dateTime: dt(5, 17, 0) },
    colorId: "1",
    _calendarId: "primary",
  },
];

// ── Demo User ────────────────────────────────────────────────────────────────

export const DEMO_USER = {
  id: "demo-user-alex",
  name: "Alex Carter",
  email: "alex@demo.tsunagu.ai",
  image: null as string | null,
};

export const DEMO_CALENDAR: any[] = [
  { id: "primary", summary: "Alex Carter", color: "#4f46e5" },
];

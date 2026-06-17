# Tsunagu — Roadmap

## Deployment
- Railway (app + PostgreSQL DB) — NOT Vercel/Neon

## What's Already Built (Do Not Rebuild)

- Gmail: read, compose, reply, forward, archive, drafts, search
- Google Calendar: full CRUD, attendees, colors, priorities, drag-resize
- AI Chat: OpenAI agents + Corsair MCP, streaming, email + calendar capable, editable EmailDraftCard + EventCard
- Auth: Google OAuth via Better Auth
- DB: Postgres (Railway) + Drizzle, Corsair encrypted tokens
- Command palette (Cmd+K), keyboard shortcuts (J/K/E/R/C/Esc/Alt+A/?)
- LLM email analysis — priority badges wired to inbox ✅
- Corsair MCP agent chat ✅
- Persistent AI chat history (sessions + messages in DB) ✅
- First-time user walkthrough (Driver.js) ✅
- Settings — user OpenAI API key ✅
- Deployment — Railway ✅

---

## Remaining Tasks

### 1. Corsair Webhooks — Gmail (real-time inbox)
- [ ] Update `app/api/webhooks/gmail/route.ts` to write to `webhook_events` + fire Inngest
- [ ] Set up Google Cloud Pub/Sub topic → push subscription → `npx corsair watch-renew`
- [ ] Integrate Inngest: `gmail/message.received` function triggers inbox refresh signal
- [ ] Client polls webhook status and auto-refreshes inbox on new mail
- **Why:** Real-time inbox without manual refresh.

### 2. Corsair Webhooks — Calendar (real-time sync)
- [x] `app/api/webhooks/calendar/route.ts` exists ✅
- [ ] Update route to write to `webhook_events` + fire Inngest
- [ ] Run `npx corsair watch-renew` to register Calendar push subscription
- [ ] Integrate Inngest: `calendar/event.changed` function triggers calendar refresh signal
- [ ] Client polls webhook status and refreshes calendar on change
- **Why:** Real-time calendar sync.

### 3. Admin Dashboard
- [ ] `/admin` route — protected, only accessible to admin users (role field on user table)
- [ ] View all users: name, email, sign-up date, Gmail/Calendar connected status
- [ ] Per-user AI credits: toggle unlimited credits (bypasses daily rate limit)
- [ ] AI usage analytics: requests/day per user, total across app, top users
- [ ] User activity: last active, emails fetched, calendar events created
- [ ] Corsair: show which plugins each user has connected
- **Why:** Visibility and control over who has access to AI features.

### 4. UI/UX Overhaul — Minimal & Simple
- [ ] Audit every page: strip unnecessary chrome, padding, visual noise
- [ ] Consistent typescale and spacing across inbox, calendar, AI chat, settings
- [ ] Email list — cleaner row design, tighter information density
- [ ] Sidebar — simplify nav, remove clutter
- [ ] AI Chat — cleaner bubble design, better empty state
- [ ] Mobile-friendly pass (layout doesn't break on smaller screens)
- **Why:** The current UI is functional but not polished.

### 5. AI Chat — Fixes + Rate Limiting
- [ ] Fix streaming response rendering (no broken markdown, no double-render)
- [ ] Rate limiting: apply per-user daily limit to all AI endpoints (`/api/ai/*`)
- [ ] Rate limit applies to: analyze-email, AI chat messages, any future AI routes
- [ ] Admin can grant unlimited credits to specific users (see Admin Dashboard)
- [ ] Show clear "you've used X/20 requests today" indicator in chat UI
- [ ] Use Corsair where AI reads email/calendar data (already done for MCP — verify all paths)
- **Why:** Prevent abuse, give admin visibility, fix UX issues.

### 6. Email Summary — On Demand Only
- [ ] Remove auto-summary / priority badge fetch that fires on every email load
- [ ] Replace with explicit "Summarize" button on each email row or email detail view
- [ ] On click: call `/api/ai/analyze-email` via Corsair gmail.api → show inline summary
- [ ] Cache the summary result so repeated clicks don't re-fetch
- [ ] Rate limit counts against the user's daily AI quota
- **Why:** Currently every inbox load triggers AI calls for every visible email — wasteful and slow.

### 7. Corsair Search API in Command Palette
- [ ] Replace/augment current Gmail search with Corsair search API endpoint
- [ ] Wire results into existing `CommandPalette.tsx`
- **Why:** Hackathon bonus — judges specifically look for this.

### 8. Demo Video (YC-style, under 3 min)
- [ ] Problem → Solution → Live demo → Tech stack slide
- [ ] Show: AI chat sending email + creating calendar event, real-time webhook updates, admin dashboard

### 9. README + Submission Checklist
- [ ] Short README (what it is, how to run, env vars)
- [ ] List of Corsair features used
- [ ] GitHub repo public + live link working
- [ ] X/Twitter + LinkedIn posts with tags

---

## Deferred (post-hackathon)

- Inngest background AI pipeline (email summarization, smart categorization)
- Waitlist & access gating

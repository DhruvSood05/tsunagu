# Tsunagu — Hackathon Roadmap

## What's Already Built (Do Not Rebuild)

- Gmail: read, compose, reply, forward, archive, drafts, search
- Google Calendar: full CRUD, attendees, colors, priorities, drag-resize
- AI Chat: OpenAI agents + Corsair MCP, streaming, email + calendar capable, editable EmailDraftCard + EventCard
- Auth: Google OAuth via Better Auth
- DB: Postgres (Neon) + Drizzle, Corsair encrypted tokens
- Command palette (Cmd+K), keyboard shortcuts (J/K/E/R/C/Esc/Alt+A/?)
- LLM email analysis — priority badges wired to inbox ✅
- Corsair MCP agent chat ✅ (hackathon bonus done)
- Persistent AI chat history (sessions + messages in DB) ✅
- First-time user walkthrough (Driver.js) ✅
- Settings — user OpenAI API key ✅
- Deployment — Vercel + Neon ✅

---

## Remaining Tasks

### 1. Corsair Webhooks — Gmail (real-time inbox)
- [ ] Create `app/api/webhooks/gmail/route.ts` to receive events
- [ ] Register Gmail push notification via `npx corsair subscribe`
- [ ] Client polls `/api/webhooks/gmail` to detect new mail and refresh inbox
- **Why:** Hackathon bonus task. Replaces polling.

### 2. Corsair Webhooks — Calendar (real-time sync)
- [x] `app/api/webhooks/calendar/route.ts` exists ✅
- [ ] Register Calendar push notification via `npx corsair subscribe`
- [ ] Client polls `/api/webhooks/calendar` and refreshes calendar on change
- **Why:** Hackathon bonus task.

### 3. Latency — Neon serverless driver
- [ ] Replace `pg` + `drizzle-orm/node-postgres` with `@neondatabase/serverless` + `drizzle-orm/neon-serverless`
- **Why:** Cuts cold-start DB connection time from ~500ms to ~50ms on Vercel.

### 4. Corsair Search API in Command Palette
- [ ] Replace/augment current Gmail search with Corsair search API endpoint
- [ ] Wire results into existing `CommandPalette.tsx`
- **Why:** Hackathon bonus — judges specifically look for this.

### 5. Demo Video (YC-style, under 3 min)
- [ ] Problem → Solution → Live demo → Tech stack slide
- [ ] Show: AI chat sending email + creating calendar event, priority badges, keyboard shortcuts, real-time webhook updates

### 6. README + Submission Checklist
- [ ] Short README (what it is, how to run, env vars)
- [ ] List of Corsair features used
- [ ] GitHub repo public + live link working
- [ ] X/Twitter + LinkedIn posts with tags

---

## Deferred (post-hackathon)

- Phase 11: Waitlist & access gating
- Phase 12: Inngest background AI pipeline

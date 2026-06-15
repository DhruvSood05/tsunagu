# Tsunagu — Hackathon Roadmap

## What's Already Built (Do Not Rebuild)

- Gmail: read, compose, reply, forward, archive, drafts, search
- Google Calendar: full CRUD, attendees, colors, priorities, drag-resize
- AI Chat: OpenAI agents + Corsair MCP, streaming, email + calendar capable
- Auth: Google OAuth via Better Auth
- DB: Postgres + Drizzle, Corsair encrypted tokens
- Command palette (Cmd+K), basic keyboard shortcuts (J/K/E/R/C/Esc)
- LLM email analysis (`/api/ai/analyze-email` — priority + suggested replies exists, not wired to inbox)
- Corsair MCP agent chat ✅ (hackathon bonus already done)

---

## Day 1 — Core Gaps

### 1. Corsair Webhooks — Gmail (real-time inbox)
- [ ] Register Gmail push notification via Corsair webhook
- [ ] Create `app/api/webhooks/gmail/route.ts` to receive events
- [ ] On new email event → invalidate/refresh inbox state client-side
- **Why:** Replaces 60s polling. Hackathon bonus task.

### 2. Corsair Webhooks — Calendar (real-time sync)
- [ ] Register Google Calendar push notification via Corsair webhook
- [ ] Create `app/api/webhooks/calendar/route.ts` to receive events
- [ ] On event change → invalidate/refresh calendar state client-side
- **Why:** Hackathon bonus task.

### 3. Auto Priority Filtering on Inbox Load
- [ ] On email list load, batch-call `/api/ai/analyze-email` for visible emails
- [ ] Display priority badge (High/Medium/Low) on each email row in `EmailRow`
- [ ] Add priority filter tab to inbox (filter by High priority)
- **Why:** `analyze-email` route already exists — just needs to be wired to inbox UI. Hackathon bonus.

### 4. Keyboard Shortcut for AI Panel + Help Modal
- [ ] Add `Alt+A` global shortcut to open/focus AI panel from anywhere in dashboard
- [ ] Add `?` shortcut to open keyboard shortcuts help modal
- [ ] List all shortcuts in the modal (J/K/E/R/C/Esc/Cmd+K/Alt+A/?)
- **Why:** User personal ask. Judges love keyboard-first UX.

### 5. Persistent AI Chat History
- [ ] Add `chat_messages` table to Drizzle schema (userId, role, content, timestamp)
- [ ] Save messages to DB on each exchange in `/api/ai/chat/route.ts`
- [ ] Load last N messages on AI panel mount
- **Why:** Currently session-only — lost on refresh.

---

## Day 2 — Polish + Bonus + Deploy

### 6. First-Time User Walkthrough (Driver.js)
- [ ] `npm install driver.js`
- [ ] Create `components/onboarding/WalkthroughTour.tsx`
- [ ] Steps: Sidebar → Inbox → Command palette → AI panel → Keyboard shortcuts
- [ ] Trigger on first sign-in (store `hasSeenTour` flag in DB or localStorage)
- **Why:** User personal ask.

### 7. Corsair Search API in Command Palette
- [ ] Replace/augment current Gmail search with Corsair search API endpoint
- [ ] Wire results into existing `CommandPalette.tsx`
- **Why:** Hackathon bonus — judges specifically look for this.

### 8. Deployment
- [ ] Deploy Next.js app to Vercel
- [ ] Set up Postgres on Railway (or Neon)
- [ ] Configure all env vars on Vercel
- [ ] Set Corsair webhook URLs to production domain
- [ ] Smoke test all flows on prod
- **Why:** Mandatory for submission. Webhooks need a public URL.

### 9. Demo Video (YC-style)
- [ ] Problem: email + calendar are fragmented, too many clicks
- [ ] Solution: Tsunagu — unified AI-powered inbox + calendar
- [ ] Demo: AI chat sending email + calendar invite in one message
- [ ] Show: real-time webhook updates, priority filtering, keyboard shortcuts
- [ ] Tech stack slide: Next.js, Postgres, Corsair, OpenAI Agents
- **Why:** Mandatory submission artifact.

### 10. README + Submission Checklist
- [ ] Short README (what it is, how to run, env vars)
- [ ] List of Corsair features used
- [ ] List of bonus tasks attempted
- [ ] GitHub repo public
- [ ] Live link working
- [ ] X/Twitter post with tags + hashtags
- [ ] LinkedIn post with tags + hashtags

---

## Open Questions (Pending Answers)

1. **Webhooks public URL** — deploying to Vercel, or using Ngrok locally first?
2. **AI keyboard shortcut** — `Alt+A` okay or different preference?
3. **Walkthrough library** — Driver.js okay or preference for something else?
4. **Chat history** — persist across devices (Postgres) or browser-only (localStorage)?

---

## Key File Reference

| File | Purpose |
|------|---------|
| `app/api/ai/chat/route.ts` | AI agent endpoint with Corsair MCP tools |
| `app/api/ai/analyze-email/route.ts` | LLM priority analysis — wire this to inbox |
| `app/api/emails/route.ts` | Email list with category filters |
| `app/api/calendar/events/route.ts` | Calendar CRUD |
| `app/dashboard/DashboardContent.tsx` | Main email UI, existing keyboard shortcuts |
| `app/dashboard/ai/AIContent.tsx` | AI chat panel — add persistent history here |
| `app/dashboard/calendar/CalendarContent.tsx` | FullCalendar — wire calendar webhook here |
| `components/layout/Sidebar.tsx` | Navigation + connection toggles |
| `components/layout/CommandPalette.tsx` | Cmd+K search — wire Corsair search API here |
| `components/email/EmailRow.tsx` (in `components/email/`) | Add priority badge here |
| `db/index.ts` | Corsair + Drizzle setup |
| `db/schema.ts` | Add `chat_messages` table here |

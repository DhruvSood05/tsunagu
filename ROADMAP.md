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

## Phase 11 — Waitlist & Access Gating (private beta)

Goal: deploy publicly but only the landing page is open; the app is locked to an
email allowlist the owner controls. Owner grants access by entering an email.

**Model**
- [ ] New `waitlist` table: `email` (unique), `name`, `status` (`pending` | `approved`), `source`, `createdAt`, `approvedAt`, `approvedBy`
- [ ] Access rule: signed-in user may use the app only if email is `approved` or matches `OWNER_EMAIL`
- [ ] Allowlist keyed by email → can pre-approve before a user ever signs in

**Flow**
- [ ] Landing CTA → "Join the waitlist" → Google sign-in (captures verified email)
- [ ] First sign-in auto-creates a `pending` waitlist row (Better Auth `databaseHooks.user.create.after`)
- [ ] Post-login routing: approved/owner → `/dashboard`, pending → `/waitlist`

**Enforcement (server-side — 3 layers)**
- [ ] Create `app/dashboard/layout.tsx` — primary gate: no session → `/`; not approved → `/waitlist` (covers all dashboard subroutes)
- [ ] Augment `lib/session-cache.ts` `getSessionCached` to return `null` for non-approved users → gates ALL protected API routes with no per-route edits (admin/waitlist routes exempt via separate helper)
- [ ] Update `app/page.tsx` redirect: approved → dashboard, pending → waitlist

**Pages**
- [ ] `/waitlist` — "You're on the list" confirmation (email + sign out), warm-editorial style
- [ ] `/admin` — owner-only console: list entries, approve by email (also pre-approve unseen emails), revoke. Gated to `OWNER_EMAIL`

**API**
- [ ] `/api/admin/waitlist` — GET (list), POST (approve / pre-add), DELETE (revoke); owner-guarded
- [ ] `/api/waitlist` — optional public POST (email-only signup) if a no-login form is added later

**Env / config**
- [ ] `OWNER_EMAIL` — always approved + only one who can open `/admin`

**Decisions (defaults chosen)**
- Admin via in-app `/admin` page (grant access live, no redeploy)
- OAuth-based waitlist (verified email, no mismatch)
- Single `OWNER_EMAIL` (revisit `role` column if multiple admins needed)

**Notes:** ~half a day, low risk (additive). Gating MUST be server-side; client checks are UX only.

---

## Phase 12 — Inngest Background AI Pipeline (optional, after webhooks)

Goal: move AI work off the request path into durable, retryable background jobs.
Only worth doing once Gmail/Calendar webhooks (Phase 1–2) exist to trigger it.

**Setup**
- [ ] `npm install inngest`; create `/api/inngest` endpoint; configure signing keys + Vercel env
- [ ] New `email_analysis` table (emailId, userId, priority, summary, category, followUp, createdAt)

**Core pipeline (strongest use case)**
- [ ] Gmail webhook → emit `email/received` event (instead of analyzing on client)
- [ ] Inngest fn: `email.received → analyze priority + summary (LLM) → store in email_analysis`
- [ ] Inbox READS precomputed priority from DB → instant, deduped, retried/rate-limited

**Stretch**
- [ ] Vector embeddings ingestion job (pairs with vector-search bonus): fan-out + backfill
- [ ] Scheduled jobs: daily digest, follow-up reminders

**Do NOT use Inngest for:** the live AI chat (SSE streaming needs low latency — keep as-is)

**Why:** strengthens the "real-time AI inbox" story; escapes Vercel 60s function timeout for long LLM work. Skip if tight on time and webhooks aren't built yet.

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

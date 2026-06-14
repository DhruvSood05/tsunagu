# Tsunagu — Codebase Architecture

## The Mental Model

Two independent identity systems that talk through one concept: the **tenant ID**.

```
User signs in with Google  (Better Auth)
         │
         │  session.user.id  ←── this IS the tenantId
         ▼
User connects Gmail/Calendar  (Corsair OAuth)
         │
         │  Corsair stores encrypted tokens under that tenantId
         ▼
Agent runs tools on behalf of that user
```

- **Better Auth** = "who is this person?"
- **Corsair** = "what third-party APIs can this person's agent use?"

---

## File Map

```
db/
  index.ts          ← DB pool + Drizzle instance + Corsair root instance
  schema.ts         ← All table definitions (Better Auth tables + Corsair tables)

lib/
  auth.ts           ← Better Auth SERVER config  (never import in client components)
  auth-client.ts    ← Better Auth CLIENT config  (safe for "use client" components)

app/api/
  auth/[...all]/route.ts          ← Catch-all: handles every /api/auth/* route
  corsair/[...all]/route.ts       ← Catch-all: handles every /api/corsair/* route
  connect/route.ts                ← Starts the OAuth flow (redirect to Google)
  connect/callback/route.ts       ← Finishes the OAuth flow (Google redirects back here)

server/
  corsair.ts        ← Re-exports corsair + db from db/index.ts
  agent.ts          ← Demo script: runs an agent with Corsair tools

app/
  page.tsx          ← Home UI: sign in, connect integrations, sign out
```

---

## db/index.ts — Database & Corsair Root

```ts
import "dotenv/config";
```
Loads your `.env` file. Every `process.env.X` in your code relies on this running first.

```ts
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool, { schema });
```
`Pool` keeps several Postgres connections open and reuses them instead of opening
a new one on every request. `drizzle()` wraps it with a type-safe query builder.
Passing `schema` gives Drizzle full TypeScript autocomplete for your tables.

```ts
export const corsair = createCorsair({
  plugins: [gmail(), googlecalendar()],
  database: pool,
  kek: process.env.CORSAIR_KEK!,
  multiTenancy: true,
});
```
- `plugins` — the third-party services Corsair knows how to connect to
- `database: pool` — Corsair stores OAuth tokens in **your** Postgres DB using the same pool
- `kek` — "Key Encryption Key". Corsair encrypts every token before storing it.
  Even if someone stole your DB they couldn't read tokens without this key.
- `multiTenancy: true` — each user's credentials are fully isolated from every other user's

> **Rule:** `db` and `corsair` are created here and imported everywhere else.
> Never create a second instance.

---

## db/schema.ts — Data Model

### Better Auth Tables (required by Better Auth)

| Table          | Purpose                                                                 |
| -------------- | ----------------------------------------------------------------------- |
| `user`         | One row per person. `id` is a random string Better Auth generates.      |
| `session`      | One row per active login. Holds the cookie token and expiry.            |
| `account`      | One row per OAuth provider per user. Stores Google access/refresh tokens.|
| `verification` | Used for email-verification flows (not active — you use Google OAuth).  |

```ts
export const userRelations = relations(user, ({ many }) => ({ ... }));
export const sessionRelations = relations(session, ({ one }) => ({ ... }));
export const accountRelations = relations(account, ({ one }) => ({ ... }));
```
These don't create DB columns. They're Drizzle metadata that enables
`experimental.joins: true` in Better Auth — session + user loaded in one SQL
query instead of two round trips.

### Corsair Tables (managed by Corsair internally)

| Table                  | Purpose                                                               |
| ---------------------- | --------------------------------------------------------------------- |
| `corsairIntegrations`  | One row per integration type (Gmail, Calendar). Stores OAuth app config.|
| `corsairAccounts`      | One row per user per integration. `tenantId` = Better Auth `user.id`. Encrypted tokens live here. |
| `corsairEntities`      | Cached objects fetched from third-party APIs (e.g. a Gmail contact).  |
| `corsairEvents`        | Audit log of actions Corsair took (e.g. "sent email").                |

> You never write to Corsair tables directly — Corsair manages them via `database: pool`.

---

## lib/auth.ts — Better Auth Server Config

```ts
export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg", schema }),
```
Connects Better Auth to Drizzle. `provider: "pg"` tells it you're on Postgres.

```ts
  experimental: { joins: true },
```
Loads user + session in one DB call instead of two. Requires the `*Relations`
exports in schema.ts.

```ts
  trustedOrigins: [process.env.BETTER_AUTH_URL ?? "http://localhost:3000"],
```
CSRF protection. Rejects requests that don't come from this origin.
Fallback to localhost for local dev.

```ts
  socialProviders: { google: { clientId, clientSecret } },
```
Enables "Sign in with Google." Keys come from Google Cloud Console.

```ts
  plugins: [nextCookies()],
```
Bridges Better Auth's session cookies with Next.js's cookie APIs. Without this,
`auth.api.getSession()` works in API routes but **not** in Server Components or
Server Actions.

---

## lib/auth-client.ts — Better Auth Client Config

```ts
export const authClient = createAuthClient({
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
});
```
Client-side auth instance. Safe to use inside `"use client"` components.
Talks to `/api/auth/*` over HTTP.

**What you use it for:**
```ts
authClient.useSession()                              // React hook — current session
authClient.signIn.social({ provider: "google" })     // redirect to Google login
authClient.signOut()                                 // clear session cookie
```

---

## app/api/auth/[...all]/route.ts — Auth API Endpoint

```ts
export const { GET, POST } = toNextJsHandler(auth);
```
The `[...all]` catch-all makes this one file handle every auth route:

| Route                          | What it does                        |
| ------------------------------ | ----------------------------------- |
| `GET  /api/auth/session`       | Returns the current session         |
| `POST /api/auth/sign-in/social`| Starts Google OAuth                 |
| `GET  /api/auth/callback/google`| Google redirects here after login  |
| `POST /api/auth/sign-out`      | Clears the session cookie           |

---

## app/api/corsair/[...all]/route.ts — Corsair API Endpoint

```ts
export const { GET, POST } = toNextJsHandler(corsair);
```
Same pattern. Corsair exposes its own internal HTTP API under `/api/corsair/*`
(used by the SDK to list tools, execute tool calls, etc.).

---

## app/api/connect/route.ts — Start OAuth Flow

Hit when the user clicks "Connect Gmail."

```ts
const session = await auth.api.getSession({ headers: await headers() });
if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
```
Verify the user is logged in before starting the OAuth flow.

```ts
const { url, state } = await generateOAuthUrl(corsair, plugin, {
  tenantId: session.user.id,   // ← THE BRIDGE between Better Auth and Corsair
  redirectUri: REDIRECT_URI,
});
```
`session.user.id` (Better Auth) becomes Corsair's `tenantId`.
All tokens stored by Corsair will be associated with this user from now on.

```ts
response.cookies.set("corsair_oauth_state", state, {
  httpOnly: true,    // JS can't read this — prevents XSS token theft
  sameSite: "lax",   // only sent on same-site navigation
  secure: process.env.NODE_ENV === "production",
  maxAge: 60 * 10,   // expires in 10 minutes
});
```
Stores the CSRF state token in a cookie to validate when Google redirects back.

---

## app/api/connect/callback/route.ts — Finish OAuth Flow

Google redirects here with `?code=...&state=...` after the user approves.

```ts
const storedState = request.cookies.get("corsair_oauth_state")?.value;
if (!storedState || storedState !== state) { /* reject */ }
```
CSRF check. The state in the URL must match what we stored in the cookie.
If they differ, someone is trying to hijack the OAuth flow.

```ts
const result = await processOAuthCallback(corsair, { code, state, redirectUri });
```
Corsair exchanges the `code` for access + refresh tokens, encrypts them,
and stores them in `corsairAccounts` under the `tenantId` it encoded in `state`.

```ts
res.cookies.delete("corsair_oauth_state");  // always clean up, success or failure
```

---

## server/agent.ts — The Agent

```ts
const tools = provider.build({ corsair: corsair.withTenant("dhruv"), tool });
```
`corsair.withTenant(userId)` scopes the instance to one user's tokens.
Every tool call the agent makes uses **that user's** stored credentials.

> **TODO for production:** replace `"dhruv"` with a real `session.user.id`
> from a verified auth check.

```ts
const agent = new Agent({
  name: "corsair-agent",
  instructions: "...",
  tools,
});
```
Corsair's `tools` expose three primitives the LLM uses to discover and call APIs:
- `list_operations` — what APIs are available?
- `get_schema` — what arguments does this API take?
- `run_script` — execute the API call

---

## app/page.tsx — The UI

```ts
"use client";
```
React Client Component. Runs in the browser. Can use hooks.

```ts
const { data: session, isPending } = authClient.useSession();
if (isPending) return null;
```
`useSession` fetches the session and re-renders on change.
Return `null` while loading to prevent a flash of wrong UI.

```ts
<a href="/api/connect?plugin=gmail">Connect Gmail</a>
```
A plain `<a>` (not Next.js `<Link>`) because we want a full browser navigation
to follow the redirect chain: `/api/connect` → Google → `/api/connect/callback` → `/`.

```ts
export default function Home() {
  return (
    <Suspense>
      <PageContent />
    </Suspense>
  );
}
```
`useSearchParams()` inside `PageContent` requires a `<Suspense>` boundary in
Next.js App Router. Without it the build fails.

---

## Full Request Flow

```
1. User hits "/"
   authClient.useSession() → GET /api/auth/session → reads cookie → returns user

2. User clicks "Sign in with Google"
   authClient.signIn.social() → POST /api/auth/sign-in/social
   → Better Auth redirects to Google consent screen
   → Google redirects to GET /api/auth/callback/google
   → Better Auth creates user + session rows, sets cookie
   → redirects to "/"

3. User clicks "Connect Gmail"
   → GET /api/connect?plugin=gmail
   → auth.api.getSession() verifies login
   → generateOAuthUrl() builds consent URL with tenantId = user.id, stores state cookie
   → redirects to Google

4. Google sends user back
   → GET /api/connect/callback?code=...&state=...
   → state cookie validated (CSRF check)
   → processOAuthCallback() exchanges code for tokens, encrypts, stores in DB
   → redirects to "/?connected=gmail"

5. Agent runs
   → corsair.withTenant(userId) scopes to that user's tokens
   → tools discover Gmail APIs dynamically and execute calls
```

---

## Key Rules Going Forward

1. **Import `db` and `corsair` only from `@/db/index`** — single source of truth
2. **Import `auth` only from `@/lib/auth`** — server only
3. **Import `authClient` only from `@/lib/auth-client`** — client only
4. **Always use `session.user.id` as the Corsair `tenantId`** — that's the bridge
5. **Never store secrets in client components** — env vars without `NEXT_PUBLIC_` prefix are server-only

import { corsair } from "@/db";

const GMAIL_API = "https://gmail.googleapis.com/gmail/v1";
const CALENDAR_API = "https://www.googleapis.com/calendar/v3";

async function refreshGoogleToken(clientId: string, clientSecret: string, refreshToken: string): Promise<string> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) throw new Error(`Token refresh failed: ${await res.text()}`);
  const data = await res.json();
  return data.access_token as string;
}

async function getPluginAccessToken(tenantId: string, plugin: "gmail" | "googlecalendar"): Promise<string> {
  const tenant = corsair.withTenant(tenantId);
  const p = tenant[plugin];

  const [creds, refreshToken] = await Promise.all([
    p.keys.get_integration_credentials(),
    p.keys.get_refresh_token(),
  ]);

  if (!creds?.client_id || !creds?.client_secret) {
    throw new Error(`Missing ${plugin} client credentials for tenant ${tenantId}`);
  }
  if (!refreshToken) {
    throw new Error(`No ${plugin} refresh token for tenant ${tenantId}`);
  }

  return refreshGoogleToken(creds.client_id, creds.client_secret, refreshToken);
}

export async function registerGmailWatch(tenantId: string): Promise<void> {
  const topicName = process.env.GMAIL_PUBSUB_TOPIC;
  if (!topicName) throw new Error("GMAIL_PUBSUB_TOPIC env var not set");

  const accessToken = await getPluginAccessToken(tenantId, "gmail");

  const res = await fetch(`${GMAIL_API}/users/me/watch`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ topicName, labelIds: ["INBOX"] }),
  });
  if (!res.ok) throw new Error(`Gmail watch failed: ${await res.text()}`);

  const data = await res.json();
  console.log(`[watch] Gmail registered for ${tenantId} — expires ${new Date(Number(data.expiration)).toISOString()}`);
}

export async function registerCalendarWatch(tenantId: string, calendarId = "primary"): Promise<void> {
  const base = (process.env.BETTER_AUTH_URL ?? "").replace(/\/$/, "");
  const webhookUrl = `${base}/api/webhooks/calendar`;

  const accessToken = await getPluginAccessToken(tenantId, "googlecalendar");

  const res = await fetch(
    `${CALENDAR_API}/calendars/${encodeURIComponent(calendarId)}/events/watch`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ id: crypto.randomUUID(), type: "web_hook", address: webhookUrl }),
    },
  );
  if (!res.ok) throw new Error(`Calendar watch failed: ${await res.text()}`);

  const data = await res.json();
  console.log(`[watch] Calendar registered for ${tenantId} — expires ${new Date(Number(data.expiration)).toISOString()}`);
}

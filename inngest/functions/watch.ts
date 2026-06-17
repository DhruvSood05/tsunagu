import { inngest } from "@/lib/inngest";
import { db } from "@/db";
import { corsairAccounts, corsairIntegrations } from "@/db/schema";
import { eq } from "drizzle-orm";
import { registerGmailWatch, registerCalendarWatch } from "@/lib/register-watch";

// Fires when a user connects Gmail or Calendar via OAuth — auto-registers the watch.
export const onPluginConnected = inngest.createFunction(
  {
    id: "on-plugin-connected",
    name: "Auto-Register Webhook Watch on Connect",
    triggers: [{ event: "tsunagu/plugin.connected" }],
    retries: 3,
  },
  async ({ event }) => {
    const { tenantId, plugin } = event.data as { tenantId: string; plugin: string };

    if (plugin === "gmail") {
      await registerGmailWatch(tenantId);
      return { tenantId, plugin, registered: true };
    }

    if (plugin === "googlecalendar") {
      await registerCalendarWatch(tenantId);
      return { tenantId, plugin, registered: true };
    }

    return { skipped: true, plugin };
  },
);

// Runs every 6 days to renew all watches before Google's 7-day TTL expires.
export const renewAllWatches = inngest.createFunction(
  {
    id: "renew-all-watches",
    name: "Auto-Renew Google Webhook Watches",
    triggers: [{ cron: "0 9 */6 * *" }],
    retries: 2,
  },
  async ({ step }) => {
    const gmailTenants = await step.run("get-gmail-tenants", async () => {
      const [integration] = await db
        .select({ id: corsairIntegrations.id })
        .from(corsairIntegrations)
        .where(eq(corsairIntegrations.name, "gmail"))
        .limit(1);
      if (!integration) return [];
      return db
        .select({ tenantId: corsairAccounts.tenantId })
        .from(corsairAccounts)
        .where(eq(corsairAccounts.integrationId, integration.id));
    });

    const calendarTenants = await step.run("get-calendar-tenants", async () => {
      const [integration] = await db
        .select({ id: corsairIntegrations.id })
        .from(corsairIntegrations)
        .where(eq(corsairIntegrations.name, "googlecalendar"))
        .limit(1);
      if (!integration) return [];
      return db
        .select({ tenantId: corsairAccounts.tenantId })
        .from(corsairAccounts)
        .where(eq(corsairAccounts.integrationId, integration.id));
    });

    const gmailResults = await step.run("renew-gmail-watches", async () => {
      const results: { tenantId: string; ok: boolean; error?: string }[] = [];
      for (const { tenantId } of gmailTenants) {
        try {
          await registerGmailWatch(tenantId);
          results.push({ tenantId, ok: true });
        } catch (e: any) {
          results.push({ tenantId, ok: false, error: e.message });
        }
      }
      return results;
    });

    const calendarResults = await step.run("renew-calendar-watches", async () => {
      const results: { tenantId: string; ok: boolean; error?: string }[] = [];
      for (const { tenantId } of calendarTenants) {
        try {
          await registerCalendarWatch(tenantId);
          results.push({ tenantId, ok: true });
        } catch (e: any) {
          results.push({ tenantId, ok: false, error: e.message });
        }
      }
      return results;
    });

    return { gmailResults, calendarResults };
  },
);

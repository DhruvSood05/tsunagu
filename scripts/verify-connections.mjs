import pg from "pg";
import { createCorsair } from "corsair";
import { gmail } from "@corsair-dev/gmail";
import { googlecalendar } from "@corsair-dev/googlecalendar";

const { Pool } = pg;
const pool = new Pool({ connectionString: "postgresql://tsunagu:tsunagu@localhost:5432/tsunagu" });

const corsair = createCorsair({
  plugins: [gmail(), googlecalendar()],
  database: pool,
  kek: "sjm1iGOA8uq4RDl8fCxKmrktUNpTfRpXD0AoG41fVjI=",
  multiTenancy: true,
});

const users = await pool.query('SELECT id, email FROM "user" ORDER BY email');

for (const user of users.rows) {
  console.log(`\n--- ${user.email} (tenant: ${user.id}) ---`);
  try {
    const tenant = corsair.withTenant(user.id);
    // Fetch a real message to see which Gmail account it belongs to
    const list = await tenant.gmail.api.messages.list({ userId: "me", maxResults: 1 });
    const msgId = list?.messages?.[0]?.id;
    if (msgId) {
      const msg = await tenant.gmail.api.messages.get({ id: msgId, format: "full" });
      const headers = msg?.payload?.headers ?? [];
      const to = headers.find(h => h.name === "To" || h.name === "Delivered-To")?.value ?? "unknown";
      const from = headers.find(h => h.name === "From")?.value ?? "unknown";
      console.log(`  Gmail connected as → To: ${to}`);
      console.log(`                        From: ${from}`);
    } else {
      console.log(`  Gmail OK but no messages found`);
    }
  } catch (e) {
    console.log(`  Gmail error: ${e?.message ?? e}`);
  }
}

await pool.end();

import "dotenv/config";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { createCorsair } from "corsair";
import { gmail } from "@corsair-dev/gmail";
import { googlecalendar } from "@corsair-dev/googlecalendar";
import * as schema from "./schema";
import { webhookEvents } from "./schema";

const isProd = process.env.NODE_ENV === "production";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: isProd ? 5 : 50,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
  ssl: isProd ? { rejectUnauthorized: false } : false,
});
export const db = drizzle(pool, { schema });

export const corsair = createCorsair({
  plugins: [
    gmail({
      webhookHooks: {
        messageChanged: {
          after: async (ctx: any, _response: any) => {
            const userId = ctx?.tenantId ?? null;
            if (!userId) return;
            await db.insert(webhookEvents).values({
              id: crypto.randomUUID(),
              userId,
              eventType: "gmail",
              receivedAt: new Date(),
            });
          },
        },
      },
    }),
    googlecalendar({
      webhookHooks: {
        onEventChanged: {
          after: async (ctx: any, _response: any) => {
            const userId = ctx?.tenantId ?? null;
            if (!userId) return;
            await db.insert(webhookEvents).values({
              id: crypto.randomUUID(),
              userId,
              eventType: "calendar",
              receivedAt: new Date(),
            });
          },
        },
      },
    }),
  ],
  database: pool,
  kek: process.env.CORSAIR_KEK!,
  multiTenancy: true,
});

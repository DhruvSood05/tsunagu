import pg from "pg";
const { Pool } = pg;
const pool = new Pool({ connectionString: "postgresql://tsunagu:tsunagu@localhost:5432/tsunagu" });

const tables = await pool.query(`SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name`);
console.log("TABLES:", tables.rows.map(x => x.table_name).join(", "));

const users = await pool.query(`SELECT id, email, created_at FROM "user" ORDER BY created_at DESC LIMIT 5`);
console.log("USERS:", users.rows.length);
users.rows.forEach(x => console.log(" -", x.id, x.email));

const sessions = await pool.query(`SELECT id, user_id, created_at, expires_at FROM session ORDER BY created_at DESC LIMIT 5`);
console.log("SESSIONS:", sessions.rows.length);
sessions.rows.forEach(x => console.log(" -", x.id, x.user_id));

const accounts = await pool.query(`SELECT id, provider_id, user_id FROM account ORDER BY created_at DESC LIMIT 5`);
console.log("ACCOUNTS:", accounts.rows.length);
accounts.rows.forEach(x => console.log(" -", x.id, x.provider_id, x.user_id));

const corsairAccounts = await pool.query(`SELECT id, tenant_id, integration_id FROM corsair_accounts ORDER BY created_at DESC LIMIT 5`);
console.log("CORSAIR_ACCOUNTS:", corsairAccounts.rows.length);
corsairAccounts.rows.forEach(x => console.log(" -", x.id, x.tenant_id, x.integration_id));

pool.end();

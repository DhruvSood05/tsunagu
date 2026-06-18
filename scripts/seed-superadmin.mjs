import pg from "pg";
const { Client } = pg;

const client = new Client({ connectionString: "postgresql://tsunagu:tsunagu@localhost:5432/tsunagu" });
await client.connect();

const res = await client.query(`SELECT id FROM "user" WHERE email = 'dhruvsood1102@gmail.com'`);
if (!res.rows.length) {
  console.error("User not found — sign in first then re-run this script");
  process.exit(1);
}

const id = res.rows[0].id;
console.log("User id:", id);

await client.query(
  `INSERT INTO user_preferences (user_id, has_seen_tour, ai_access, role, updated_at)
   VALUES ($1, true, true, 'superadmin', NOW())
   ON CONFLICT (user_id) DO UPDATE SET role = 'superadmin', ai_access = true, updated_at = NOW()`,
  [id]
);

console.log("Done — dhruvsood1102@gmail.com is now superadmin with aiAccess=true");
await client.end();

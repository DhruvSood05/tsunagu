import pg from "pg";
const { Pool } = pg;
const pool = new Pool({ connectionString: "postgresql://tsunagu:tsunagu@localhost:5432/tsunagu" });

console.log("Clearing all Corsair connection data...");
await pool.query("DELETE FROM corsair_entities");
await pool.query("DELETE FROM corsair_events");
await pool.query("DELETE FROM corsair_accounts");
console.log("Done. All Gmail and Calendar connections have been removed.");
console.log("Users can now reconnect from the dashboard on next login.");

await pool.end();

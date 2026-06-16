import pg from "pg";
const { Pool } = pg;
const pool = new Pool({ connectionString: "postgresql://tsunagu:tsunagu@localhost:5432/tsunagu" });

// List real user IDs from Better Auth
const users = await pool.query('SELECT id FROM "user"');
const realIds = new Set(users.rows.map(r => r.id));
console.log("Real user IDs:", [...realIds]);

// Find stale corsair_accounts with tenant_ids that don't match any user
const accounts = await pool.query(`
  SELECT ca.id, ca.tenant_id, ci.name as plugin
  FROM corsair_accounts ca
  JOIN corsair_integrations ci ON ca.integration_id = ci.id
`);

const stale = accounts.rows.filter(r => !realIds.has(r.tenant_id));
console.log("\nStale accounts to delete:", stale.map(r => `${r.tenant_id}/${r.plugin}`));

if (stale.length === 0) {
  console.log("Nothing to clean up.");
  await pool.end();
  process.exit(0);
}

for (const acct of stale) {
  // Delete child rows first
  await pool.query("DELETE FROM corsair_entities WHERE account_id = $1", [acct.id]);
  await pool.query("DELETE FROM corsair_events WHERE account_id = $1", [acct.id]);
  await pool.query("DELETE FROM corsair_accounts WHERE id = $1", [acct.id]);
  console.log(`Deleted stale account: ${acct.tenant_id}/${acct.plugin}`);
}

console.log("\nDone. Remaining accounts:");
const remaining = await pool.query(`
  SELECT ca.tenant_id, ci.name as plugin
  FROM corsair_accounts ca
  JOIN corsair_integrations ci ON ca.integration_id = ci.id
  ORDER BY ca.tenant_id
`);
remaining.rows.forEach(r => console.log(`  ${r.tenant_id} → ${r.plugin}`));

await pool.end();

import pg from "pg";
const { Pool } = pg;
const pool = new Pool({ connectionString: "postgresql://tsunagu:tsunagu@localhost:5432/tsunagu" });

const users = await pool.query('SELECT id, email, name FROM "user" ORDER BY email');
console.log("USERS:", users.rows.length);
users.rows.forEach(x => console.log(JSON.stringify(x)));

const accounts = await pool.query(`
  SELECT ca.tenant_id, ci.name as plugin
  FROM corsair_accounts ca
  JOIN corsair_integrations ci ON ca.integration_id = ci.id
  ORDER BY ca.tenant_id, ci.name
`);
console.log("\nCORSAIR ACCOUNTS (tenant_id → plugin):");
accounts.rows.forEach(x => console.log(`  ${x.tenant_id} → ${x.plugin}`));

pool.end();

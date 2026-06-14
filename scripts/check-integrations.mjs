import pg from "pg";
const { Pool } = pg;
const pool = new Pool({ connectionString: "postgresql://tsunagu:tsunagu@localhost:5432/tsunagu" });

const integrations = await pool.query(`SELECT id, name, config FROM corsair_integrations ORDER BY name`);
console.log("INTEGRATIONS:", integrations.rows.length);
integrations.rows.forEach(x => {
  const cfg = x.config;
  console.log(` - ${x.name} | client_id: ${cfg?.client_id ?? "(none)"} | redirect_url: ${cfg?.redirect_url ?? "(none)"}`);
});

pool.end();

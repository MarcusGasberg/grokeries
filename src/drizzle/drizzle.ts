import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";
import { Resource } from "sst";
import { schema } from "@/zero/zero-schema.gen";

const pool = new Pool({
  host: Resource.Postgres.host,
  port: Resource.Postgres.port,
  user: Resource.Postgres.username,
  password: Resource.Postgres.password,
  database: Resource.Postgres.database,
  ssl: false,
});

const db = drizzle(pool, { schema });
await migrate(db, {
  migrationsFolder: "migrations",
});

export default db;

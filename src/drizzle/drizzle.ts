import * as schema from "@/schema";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";
import { Resource } from "sst";

const pool = new Pool({
  host: Resource.Postgres.host,
  port: Resource.Postgres.port,
  user: Resource.Postgres.username,
  password: Resource.Postgres.password,
  database: Resource.Postgres.database,
  ssl: false,
});

const db = drizzle(pool, {
  schema,
});

await migrate(db, {
  migrationsFolder: "./src/drizzle/migrations",
});

export default db;

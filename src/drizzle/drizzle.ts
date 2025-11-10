/// <reference path="../../sst-env.d.ts" />
import * as schema from "@/schema";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { createServerOnlyFn } from "@tanstack/react-start";
import postgres from "postgres";
import { must } from "@/shared/must";

// Lazy initialization to avoid connecting during build/prerender
type DbType = ReturnType<typeof drizzle<typeof schema>>;
let _db: DbType | null = null;
let _driver: ReturnType<typeof postgres> | null = null;

const getDatabase = createServerOnlyFn(async (): Promise<DbType> => {
  if (_db) return _db;

  const connectionString = must(
    process.env.DB_CONNECTION_STRING,
    "DB_CONNECTION_STRING must be set",
  );

  if (!_driver) {
    _driver = postgres(connectionString);
  }

  _db = drizzle({ client: _driver, schema, casing: "snake_case" });

  await migrate(_db, {
    migrationsFolder: "./src/drizzle/migrations",
  });

  return _db;
});

export const db = new Proxy({} as DbType, {
  get(target, prop) {
    if (!_db) {
      throw new Error(
        "Database not initialized. Call getDatabase() first or ensure you're in a server context.",
      );
    }
    return Reflect.get(_db, prop);
  },
});

// Initialize db on first import in server context
if (typeof window === "undefined" && process.env.DB_CONNECTION_STRING) {
  await getDatabase()
    .then((database: DbType) => {
      _db = database;
    })
    .catch(() => {
      // Silently fail during build/prerender
    });
}

import { defineConfig } from "drizzle-kit";
import { must } from "@/shared/must";

const connectionString = must(
  process.env.DB_CONNECTION_STRING,
  "DB_CONNECTION_STRING must be set",
);

export default defineConfig({
  dialect: "postgresql",
  // Pick up all our schema files
  schema: "./src/schema.ts",
  out: "./src/drizzle/migrations/",
  dbCredentials: {
    url: connectionString,
    ssl: false,
  },
});

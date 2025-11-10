import postgres from "postgres";
import fs from "node:fs";
import { must } from "@/shared/must";

export async function deploy() {
  const connectionString = must(
    process.env.ZERO_UPSTREAM_DB,
    "ZERO_UPSTREAM_DB must be set",
  );
  const sql = postgres(connectionString);
  const perms = fs.readFileSync(".permissions.sql", "utf8");
  await sql.unsafe(perms);
}

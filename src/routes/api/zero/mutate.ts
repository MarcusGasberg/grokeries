import { json } from "@tanstack/react-start";
import {
  PushProcessor,
  ZQLDatabase,
  PostgresJSConnection,
} from "@rocicorp/zero/pg";
import postgres from "postgres";
import { createServerFileRoute } from "@tanstack/react-start/server";
import { must } from "@/shared/must";
import { schema } from "@/zero/zero-schema";
import { createMutators } from "@/zero/mutators";
import { getUserID } from "@/lib/get-user-id";

const pgURL = must(process.env.PG_URL, "PG_URL is required");

const processor = new PushProcessor(
  new ZQLDatabase(new PostgresJSConnection(postgres(pgURL)), schema),
);

export const ServerRoute = createServerFileRoute("/api/zero/mutate").methods({
  POST: async ({ request }) => {
    const userID = await getUserID(request);
    if (typeof userID === "object") {
      return userID;
    }

    try {
      const result = await processor.process(
        createMutators(userID ? { sub: userID } : undefined),
        request,
      );
      return json(result);
    } catch (err) {
      return json({ error: "Invalid token" }, { status: 401 });
    }
  },
});

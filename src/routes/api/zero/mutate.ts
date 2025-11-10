import { json } from "@tanstack/react-start";
import {
  PushProcessor,
  ZQLDatabase,
  PostgresJSConnection,
} from "@rocicorp/zero/pg";
import postgres from "postgres";
import { must } from "@/shared/must";
import { schema } from "@/zero/zero-schema";
import { createMutators } from "@/zero/mutators";
import { getUserID } from "@/lib/get-user-id";
import { createFileRoute } from "@tanstack/react-router";

const connectionString = must(
  process.env.ZERO_UPSTREAM_DB,
  "ZERO_UPSTREAM_DB is required",
);

const processor = new PushProcessor(
  new ZQLDatabase(new PostgresJSConnection(postgres(connectionString)), schema),
);

export const Route = createFileRoute("/api/zero/mutate")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const userID = await getUserID(request);
        if (typeof userID === "object") {
          return json(userID);
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
    },
  },
});

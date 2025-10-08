import { createServerFileRoute } from "@tanstack/react-start/server";
import { json } from "@tanstack/react-start";
import {
  PushProcessor,
  ZQLDatabase,
  PostgresJSConnection,
} from "@rocicorp/zero/pg";
import postgres from "postgres";
import { schema } from "@/zero/zero-schema";
import { createMutators } from "@/zero/mutators";
import { getUserID } from "@/lib/get-user-id";

// PushProcessor is provided by Zero to encapsulate a standard
// implementation of the push protocol.
const processor = new PushProcessor(
  new ZQLDatabase(
    new PostgresJSConnection(postgres(process.env.ZERO_UPSTREAM_DB! as string)),
    schema,
  ),
);

export const ServerRoute = createServerFileRoute("/api/push/$").methods({
  POST: async (c) => {
    const userResult = await getUserID(c.request);

    // If getUserID returns an error response (which is an object without 'sub'), return it directly
    if (typeof userResult === "object" && !("sub" in userResult)) {
      return userResult;
    }

    const authData = userResult && typeof userResult === "object"
      ? { sub: userResult.sub, name: userResult.name }
      : undefined;

    try {
      const result = await processor.process(createMutators(authData), c.request);
      return json(result);
    } catch (err) {
      console.error("Error processing mutation:", err);
      return json({ error: "Invalid token" }, { status: 401 });
    }
  },
});

import { createServerFileRoute } from "@tanstack/react-start/server";
import {
  PushProcessor,
  ZQLDatabase,
  PostgresJSConnection,
} from "@rocicorp/zero/pg";
import postgres from "postgres";
import { schema } from "@/zero/zero-schema";
import { createMutators } from "@/zero/mutators";
import { auth } from "@/lib/auth";

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
    const session = await auth.api.getSession({
      headers: c.request.headers,
    });
    const authData = session?.user
      ? { sub: session.user.id, name: session.user.name }
      : undefined;
    const result = await processor.process(createMutators(authData), c.request);
    return result;
  },
});

import { must } from "@/shared/must";
import { json } from "@tanstack/react-start";
import * as jose from "jose";
import { auth } from "./auth";

export async function getUserID(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader) {
    return undefined;
  }

  const prefix = "Bearer ";
  if (!authHeader.startsWith(prefix)) {
    return json(
      { error: "Missing or invalid authorization header" },
      { status: 401 },
    );
  }

  const token = authHeader.slice(prefix.length);
  const set = await auth.api.getJwks();
  const jwks = jose.createLocalJWKSet(set as any);

  try {
    const { payload } = await jose.jwtVerify(token, jwks);
    const sub = must(payload.sub, "Empty sub in token");
    const name = (payload.name as string) || "User";
    return { sub, name };
  } catch (err: any) {
    console.info("Could not verify token: " + (err.message ?? String(err)));
    return json({ error: "Invalid token" }, { status: 401 });
  }
}

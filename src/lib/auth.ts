import db from "@/drizzle/drizzle";
import { betterAuth } from "better-auth";

import { createAuthMiddleware, jwt } from "better-auth/plugins";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { must } from "@/shared/must";
import cookie from "cookie";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  emailAndPassword: {
    enabled: true,
  },
  plugins: [
    jwt({
      jwt: {
        expirationTime: "1h",
      },
    }),
  ],
  hooks: {
    // We set the JWT, email, and userid in cookies to avoid needing an extra
    // round-trip to get them on startup.
    after: createAuthMiddleware(async (ctx) => {
      console.log("GOT HERE", ctx);
      if (ctx.path.indexOf("/sign-in/") !== -1) {
        const headers = must(ctx.context.responseHeaders);
        const setCookieHeader = ctx.context.responseHeaders?.get("set-cookie");
        const cookieVal = setCookieHeader?.split(";")[0];

        const session = await auth.api.getSession({
          headers: new Headers({
            cookie: cookieVal ?? "",
          }),
        });
        const token = await auth.api.getToken({
          headers: new Headers({
            cookie: cookieVal ?? "",
          }),
        });

        if (session && token) {
          setCookies(headers, {
            userid: session.user.id,
            email: session.user.email,
            name: session.user.name,
            jwt: token.token,
          });
        }
        return;
      }

      if (ctx.path.indexOf("/sign-out") !== -1) {
        const headers = must(ctx.context.responseHeaders);
        setCookies(headers, {
          userid: "",
          email: "",
          name: "",
          jwt: "",
        });
        return;
      }
    }),
  },
});

export function setCookies(
  headers: Headers,
  cookies: { userid: string; name: string; email: string; jwt: string },
) {
  const opts = {
    // 1 year. Note that it doesn't really matter what this is as the JWT has
    // its own, much shorter expiry above. It makes sense for it to be long
    // since by default better auth will extend its own session indefinitely
    // as long as you keep calling getSession().
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
  };
  for (const [key, value] of Object.entries(cookies)) {
    headers.append("Set-Cookie", cookie.serialize(key, value, opts));
  }
}

import db from "@/drizzle/drizzle";
import { betterAuth } from "better-auth";

import { createAuthMiddleware, jwt } from "better-auth/plugins";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { must } from "@/shared/must";
import cookie from "cookie";
import { sendVerificationEmail } from "./email";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: process.env.NODE_ENV === "production", // Only require in production
    sendResetPassword: async ({ user, url }) => {
      // Send password reset email
      if (process.env.RESEND_API_KEY) {
        await sendVerificationEmail({
          to: user.email,
          type: "reset-password",
          verificationUrl: url,
          userName: user.name,
        });
      } else {
        // In dev mode without Resend, log the URL
        console.log(`\n🔐 PASSWORD RESET LINK:\n${url}\n`);
      }
    },
  },
  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => {
      // Send verification email when user signs up
      if (process.env.RESEND_API_KEY) {
        await sendVerificationEmail({
          to: user.email,
          type: "verify-email",
          verificationUrl: url,
          userName: user.name,
        });
      } else {
        // In dev mode without Resend, log the URL
        console.log(`\n✉️  EMAIL VERIFICATION LINK FOR ${user.email}:\n${url}\n`);
      }
    },
    sendOnSignUp: true, // Automatically send verification email on sign up
    autoSignInAfterVerification: true, // Auto sign in after verifying email
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

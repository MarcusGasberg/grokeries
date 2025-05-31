import { vpc } from "./network";
import { DB_CONNECTION_STRING, viewSyncer } from "./zero";

export const web = new sst.aws.TanStackStart("Web", {
  vpc: vpc,
  dev: {
    command: "npm run dev",
  },
  environment: {
    DATABASE_URL: DB_CONNECTION_STRING,
    ZERO_AUTH_SECRET: "secret-shh",
    PUBLIC_SERVER:
      $app.stage !== "production" ? "http://localhost:4848" : viewSyncer.url,
  },
});

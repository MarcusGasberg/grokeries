import { vpc } from "./network";

export const postgres = new sst.aws.Postgres("Postgres", {
  vpc,
  transform: {
    parameterGroup: {
      parameters: [
        {
          name: "rds.logical_replication",
          value: "1",
          applyMethod: "pending-reboot",
        },
        {
          name: "rds.force_ssl",
          value: "0",
          applyMethod: "pending-reboot",
        },
        {
          name: "max_connections",
          value: "1000",
          applyMethod: "pending-reboot",
        },
      ],
    },
  },
  dev: {
    username: "user",
    password: "password",
    database: "postgres",
    port: 5432,
    host: "127.0.0.1",
  },
});

export const drizzleStudio = new sst.x.DevCommand("Studio", {
  link: [postgres],
  dev: {
    command: "npx drizzle-kit studio",
  },
});

export const generateSchema = new sst.x.DevCommand("GenerateSchema", {
  link: [postgres],
  dev: {
    command:
      "drizzle-zero generate --format --output ./src/zero/zero-schema.gen.ts",
  },
});

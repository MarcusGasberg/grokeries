/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
  app(input) {
    return {
      name: "grokeries",
      removal: input?.stage === "production" ? "retain" : "remove",
      home: "aws",
      providers: {
        aws: {
          profile: input.stage === "production" ? "gasberg-production" : "gasberg-dev"
        }
      }
    };
  },
  async run() {
    const vpc = new sst.aws.Vpc("VPC", {
      bastion: true,
      nat: "managed",
    });
    const postgres = new sst.aws.Postgres("Postgres", { vpc, proxy: true });

    new sst.x.DevCommand("Studio", {
      link: [postgres],
      dev: {
        command: "npx drizzle-kit studio",
      },
    });


    new sst.aws.TanStackStart("Web");
  },
});

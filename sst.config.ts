/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
  app(input) {
    return {
      name: "grokeries",
      removal: input?.stage === "production" ? "retain" : "remove",
      home: "aws",
      providers: {
        aws: {
          profile:
            input.stage === "production" ? "gasberg-production" : "gasberg-dev",
        },
        command: "1.0.2",
      },
    };
  },
  async run() {
    await import("./infra/network");
    await import("./infra/cluster");
    await import("./infra/postgres");
    await import("./infra/web");
    await import("./infra/zero");

    return {
      bar: "ok",
    };
  },
});

/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
  app(input) {
    return {
      name: "grokeries",
      removal: input?.stage === "production" ? "retain" : "remove",
      home: "aws",
      region: process.env.AWS_REGION || "eu-central-1",
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
    const { execSync } = await import("child_process");
    const vpc = new sst.aws.Vpc("MyVPC");

    const cluster = new sst.aws.Cluster("Cluster", {
      vpc,
    });

    const postgres = new sst.aws.Postgres("Postgres", {
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

    const DB_CONNECTION_STRING = $interpolate`postgresql://${postgres.username}:${postgres.password}@${postgres.host}:${postgres.port}/${postgres.database}`;

    const drizzleStudio = new sst.x.DevCommand("Studio", {
      link: [postgres],
      dev: {
        command: "npx drizzle-kit studio",
      },
    });

    const generateSchema = new sst.x.DevCommand("GenerateSchema", {
      link: [postgres],
      dev: {
        command:
          "drizzle-zero generate --format --output ./src/zero/zero-schema.gen.ts",
      },
    });

    const zeroVersion = execSync(
      "npm list @rocicorp/zero | grep @rocicorp/zero | head -1 | cut -f 3 -d @",
    )
      .toString()
      .trim();

    const resendApiKey = new sst.Secret("ResendApiKey");

    const replicationBucket = new sst.aws.Bucket(`replication-bucket`);

    // Common environment variables
    // Note: In production, ZERO_AUTH_JWKS_URL should point to your web app's JWKS endpoint
    // TODO: Update this when you have a production domain configured
    const commonEnv = {
      ZERO_UPSTREAM_DB: DB_CONNECTION_STRING,
      ZERO_CVR_DB: DB_CONNECTION_STRING,
      ZERO_CHANGE_DB: DB_CONNECTION_STRING,
      ZERO_AUTH_JWKS_URL: "http://localhost:3000/api/auth/jwks",
      ZERO_REPLICA_FILE: "sync-replica.db",
      ZERO_IMAGE_URL: `rocicorp/zero:${zeroVersion}`,
      ZERO_CVR_MAX_CONNS: "10",
      ZERO_UPSTREAM_MAX_CONNS: "10",
      ZERO_LITESTREAM_BACKUP_URL: $dev
        ? "file:///tmp/zero-backup"
        : $interpolate`s3://${replicationBucket.name}/backup`,
    };

    // Replication Manager Service
    // Note: In dev mode, zero-cache-dev handles both replication and view syncing
    // This service only runs in production
    const replicationManager = new sst.aws.Service(`replication-manager`, {
      cluster,
      cpu: "0.5 vCPU",
      memory: "1 GB",
      architecture: "arm64",
      image: commonEnv.ZERO_IMAGE_URL,
      link: [replicationBucket],
      dev: false,
      wait: true,
      health: {
        command: ["CMD-SHELL", "curl -f http://localhost:4849/ || exit 1"],
        interval: "5 seconds",
        retries: 3,
        startPeriod: "300 seconds",
      },
      environment: {
        ...commonEnv,
        ZERO_NUM_SYNC_WORKERS: "0",
      },
      loadBalancer: {
        public: false,
        ports: [
          {
            listen: "80/http",
            forward: "4849/http",
          },
        ],
      },
      transform: {
        loadBalancer: {
          idleTimeout: 3600,
        },
        target: {
          healthCheck: {
            enabled: true,
            path: "/keepalive",
            protocol: "HTTP",
            interval: 5,
            healthyThreshold: 2,
            timeout: 3,
          },
        },
      },
    });

    // View Syncer Service
    const viewSyncer = new sst.aws.Service(
      `view-syncer`,
      {
        cluster,
        cpu: "1 vCPU",
        memory: "2 GB",
        architecture: "arm64",
        image: commonEnv.ZERO_IMAGE_URL,
        link: [replicationBucket],
        dev: {
          command: "bunx zero-cache-dev -p src/zero/zero-schema.ts --push-url=http://localhost:3000/api/push",
        },
        health: {
          command: ["CMD-SHELL", "curl -f http://localhost:4848/ || exit 1"],
          interval: "5 seconds",
          retries: 3,
          startPeriod: "300 seconds",
        },
        environment: $dev
          ? {
              ZERO_UPSTREAM_DB: DB_CONNECTION_STRING,
              ZERO_AUTH_JWKS_URL: "http://localhost:3000/api/auth/jwks",
              ZERO_REPLICA_FILE: "sync-replica.db",
            }
          : {
              ...commonEnv,
              ZERO_CHANGE_STREAMER_MODE: "discover",
            },
        logging: {
          retention: "1 month",
        },
        loadBalancer: {
          public: true,
          rules: [{ listen: "80/http", forward: "4848/http" }],
        },
        transform: {
          target: {
            healthCheck: {
              enabled: true,
              path: "/keepalive",
              protocol: "HTTP",
              interval: 5,
              healthyThreshold: 2,
              timeout: 3,
            },
            stickiness: {
              enabled: true,
              type: "lb_cookie",
              cookieDuration: 120,
            },
            loadBalancingAlgorithmType: "least_outstanding_requests",
          },
        },
      },
      {
        dependsOn: [replicationManager],
      },
    );

    // Permissions deployment
    // Note: this setup requires your CI/CD pipeline to have access to your
    // Postgres database. If you do not want to do this, you can also use
    // `npx zero-deploy-permissions --output-format=sql` during build to
    // generate a permissions.sql file, then run that file as part of your
    // deployment within your VPC. See hello-zero-solid for an example:
    // https://github.com/rocicorp/hello-zero-solid/blob/main/sst.config.ts#L141
    const zeroDeployPermission = new command.local.Command(
      "zero-deploy-permissions",
      {
        create: `npx zero-deploy-permissions -p ${process.cwd()}/src/zero/zero-schema.ts`,
        // Run the Command on every deploy ...
        triggers: [Date.now()],
        environment: {
          ZERO_UPSTREAM_DB: commonEnv.ZERO_UPSTREAM_DB,
        },
      },
      // after the view-syncer is deployed.
      { dependsOn: viewSyncer },
    );

    const web = new sst.aws.TanStackStart("Web", {
      vpc: vpc,
      link: [postgres],
      dev: {
        command: "npm run dev",
      },
      environment: {
        DATABASE_URL: DB_CONNECTION_STRING,
        RESEND_API_KEY: resendApiKey.value,
        PUBLIC_SERVER:
          $app.stage !== "production"
            ? "http://localhost:4848"
            : viewSyncer.url,
      },
    });

    return {
      bar: "ok",
      Postgres: postgres,
      DATABASE_URL: DB_CONNECTION_STRING,
    };
  },
});

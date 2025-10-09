# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## External Documentation

**Rocicorp Zero**: For Zero-specific questions, reference https://zero.rocicorp.dev/llms.txt for comprehensive documentation on Zero's architecture, API, and best practices.

## Commands

### Development
- `npm run dev` - Start SST development server with Vite (runs on port 3000)
- `npm run build` - Build the application for production
- `npm run dev:zero` - Start Zero cache dev server for local development

### Database
- `npm run db` - Open Drizzle Kit shell (requires SST shell)
- `npm run create-migration` - Create a new database migration from schema changes in `src/schema.ts`
- `npm run generate` - Generate Zero schema types from Drizzle schema
- `npm run dev:db-up` - Start local PostgreSQL via Docker Compose
- `npm run dev:db-down` - Stop local PostgreSQL and remove volumes

### AWS
- `npm run sso` - Login to AWS SSO (session: gasberg)

## Architecture Overview

### Core Technologies
- **Framework**: TanStack Start (React-based meta-framework) with AWS Lambda target
- **Routing**: TanStack Router with file-based routing in `src/routes/`
- **Database**: PostgreSQL with Drizzle ORM
- **Real-time Sync**: Rocicorp Zero for local-first architecture with real-time collaboration
- **Authentication**: Better Auth with JWT tokens and email/password
- **Styling**: Tailwind CSS v4 with shadcn/ui components
- **Infrastructure**: SST v3 (deployed to AWS)

### Real-time Sync Architecture (Zero)

This app uses **Rocicorp Zero**, a local-first sync system that enables instant UI updates and offline-first functionality.

**Key Concepts:**
- **Zero Schema** (`src/zero/zero-schema.ts`): Defines what data syncs to clients. Generated from Drizzle schema via `npm run generate`
- **Mutators** (`src/zero/mutators.ts`): Custom mutations that run transactionally (e.g., creating a grocery list + adding user as member)
- **View Syncer Service**: AWS ECS service that manages real-time subscriptions and pushes changes to clients
- **Replication Manager**: Handles logical replication from PostgreSQL
- **Push Endpoint** (`/api/push/$`): Server endpoint that processes mutations from clients

**Important Files:**
- `src/components/zero-init.tsx` - Initializes Zero client with auth and mutators
- `src/routes/api/push/$.ts` - Handles client push requests
- `src/routes/api/zero/mutate.ts` - Alternative mutation endpoint (verify usage vs push)
- `sst.config.ts:49-56` - PostgreSQL configuration with logical replication enabled

**Data Flow:**
1. Client makes changes via Zero mutators
2. Changes sync to server via `/api/push/$` endpoint
3. Server processes mutations and writes to PostgreSQL
4. View Syncer detects changes and pushes to subscribed clients
5. All clients update instantly

### Authentication Flow

Uses Better Auth with custom JWT hooks to set cookies for Zero authentication:

1. User signs in via `/api/auth/sign-in/*` endpoints
2. Better Auth hook (`src/lib/auth.ts:26-64`) extracts JWT and user info
3. Custom `setCookies()` sets `userid`, `email`, `name`, and `jwt` cookies
4. Frontend reads cookies in `session-init.tsx` to populate session context
5. Zero client uses JWT from cookies for authenticated requests
6. Server validates JWT via `getUserID()` helper (`src/lib/get-user-id.ts`)

**Important:** The JWT has a 1-hour expiration but Better Auth extends sessions automatically via `getSession()` calls.

### Database Schema & Migrations

**Primary Schema** (`src/schema.ts`):
- Authentication tables: `user`, `session`, `account`, `verification`, `jwks`
- Grocery app tables: `groceryList`, `groceries`, `groceryListMembers`, `groceryListInvitations`
- Uses Drizzle relations for type-safe joins

**Workflow:**
1. Modify `src/schema.ts` (Drizzle schema)
2. Run `npm run create-migration` to generate SQL migration
3. Run `npm run generate` to sync Zero schema types
4. Migrations auto-apply in dev; in production they're managed via SST

**Note:** Zero permissions are deployed via `zero-deploy-permissions` command in `sst.config.ts:216-228`. Currently set to `ANYONE_CAN_DO_ANYTHING` in `src/zero/zero-schema.ts:13-15` - should be locked down for production.

### Router Context Pattern

The router context (`src/router.tsx`) provides two key dependencies to all routes:

- `zero`: Zero client instance (initialized in `zero-init.tsx`)
- `session`: Auth session data (initialized in `session-init.tsx`)

**Access via:**
```typescript
const { zero, session } = useRouteContext();
```

Both are populated during app initialization and available to all route components.

### File-based Routing

Routes are in `src/routes/` and auto-generate `routeTree.gen.ts`:

- `__root.tsx` - Root layout with head/body structure
- `_layout/route.tsx` - Protected layout for authenticated pages
- `_layout/groceries/index.tsx` - Main grocery list page
- `login.tsx`, `register.tsx` - Auth pages
- `api/*` - Server-side API routes

### SST Infrastructure (sst.config.ts)

**Production Architecture:**
- VPC with isolated networking
- RDS PostgreSQL with logical replication enabled
- Two ECS services:
  - **Replication Manager**: Manages database change stream (port 4849)
  - **View Syncer**: Handles client sync subscriptions (port 4848, public ALB)
- TanStack Start app deployed via SST's TanStackStart construct
- S3 bucket for Litestream backups of Zero replica

**Environment Variables:**
- `DATABASE_URL` / `ZERO_UPSTREAM_DB`: PostgreSQL connection string
- `PUBLIC_SERVER`: View Syncer URL (localhost:4848 in dev, ALB URL in prod)
- `ZERO_AUTH_SECRET`: JWT verification secret (prod only; dev uses JWKS URL)
- `RESEND_API_KEY`: For sending invitation emails

**Development vs Production:**
- Dev uses local PostgreSQL on port 5432 (via Docker Compose)
- Prod uses RDS with SSL disabled (see `rds.force_ssl: "0"` in config)
- Stage-based AWS profiles: `gasberg-dev` vs `gasberg-production`

## Component Patterns

### UI Components
- Located in `src/components/ui/` (shadcn/ui based)
- Use `cn()` utility from `src/lib/utils.ts` for conditional classes
- Built with Radix UI primitives + Tailwind CSS

### Forms
- React Hook Form with Zod validation
- Schema definitions in `src/shared/*.form.ts`
- Use `@hookform/resolvers/zod` for validation integration

### Shared Code
- `src/shared/must.ts` - Runtime assertion helper (throws if value is null/undefined)
- Used extensively for environment variables and required values

## Important Patterns

1. **Always use `@/` imports** - Absolute imports configured via tsconfig path alias
2. **Environment variables** - Access via `import.meta.env.VITE_*` (client) or `process.env.*` (server)
3. **Database access** - Import `db` from `@/drizzle/drizzle.ts` for Drizzle ORM instance
4. **Zero queries** - Access via `zero.query.*` from router context, not direct database queries
5. **Server/client split** - Files in `src/routes/api/` are server-only; use `createServerFileRoute`
- use bun
- If some data is empty it might be due to permissions in @src/zero/zero-schema.ts
- My app has a brutalism style vibe to it
# Agent Guidelines for Grokeries

## Build/Lint/Test Commands

### Build Commands
- `npm run build` - Build the application for production
- `vite build` - Direct Vite build command

### Development Commands
- `npm run dev` - Start development server with SST
- `sst dev -- vite dev` - Direct SST dev command

### Database Commands
- `npm run db` - Open Drizzle Kit shell
- `sst shell drizzle-kit` - Direct database shell
- `npm run generate` - Generate Zero schema types
- `npm run create-migration` - Create new database migration

### Testing
No test framework currently configured. Run manual testing or add Vitest/Jest as needed.

## Code Style Guidelines

### TypeScript Configuration
- Strict mode enabled (`"strict": true`)
- Target ES2022, module resolution "Bundler"
- JSX transform: `"react-jsx"`
- Path aliases: `@/*` maps to `./src/*`

### Import Style
- Use absolute imports with `@/` prefix
- Group imports: React/React hooks first, then external libraries, then internal modules
- Example:
```typescript
import * as React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
```

### Component Patterns
- Functional components with TypeScript
- Use `React.ComponentProps` for prop extension
- PascalCase for component names
- camelCase for props, state, and functions
- Example:
```typescript
function MyComponent({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("base-styles", className)} {...props} />
}
```

### Naming Conventions
- Components: PascalCase (e.g., `GroceryCard`, `UserMenu`)
- Files: PascalCase for components, camelCase for utilities
- Variables/Functions: camelCase
- Types/Interfaces: PascalCase
- Constants: UPPER_SNAKE_CASE

### Styling
- Tailwind CSS with CSS variables
- Shadcn/ui components with "new-york" style
- Use `cn()` utility for conditional classes
- Follow existing design system patterns

### Data Validation
- Use Zod schemas for form validation and type safety
- Define schemas in separate files (e.g., `shared/*.form.ts`)
- Export inferred types: `export type FormType = z.infer<typeof schema>`

### Error Handling
- Use try/catch blocks for async operations
- Validate data at boundaries with Zod
- Handle loading/error states in components

### Database
- Drizzle ORM with PostgreSQL
- Define schemas in `src/schema.ts`
- Use relations for type safety
- Run migrations with `npm run create-migration`

### State Management
- Zero (Rocicorp) for real-time data sync
- React Query for server state
- Local component state with `useState`

### Formatting
- Prettier for code formatting (automatically applied)
- No explicit linting rules configured
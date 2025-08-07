import { createRouter as createTanStackRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'

export function createRouter() {
  const router = createTanStackRouter({
    routeTree,
    defaultPreload: 'viewport',
    // It is fine to call Zero multiple times for same query, Zero dedupes the
    // queries internally.
    defaultPreloadStaleTime: 0,
    // We don't want TanStack skipping any calls to us. We want to be asked to
    // preload every link. This is fine because Zero has its own internal
    // deduping and caching.
    defaultPreloadGcTime: 0,
    defaultErrorComponent: (err) => <p>{err.error.stack}</p>,
    defaultNotFoundComponent: () => <p>not found</p>,
    scrollRestoration: true,
  })

  return router
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof createRouter>
  }
}

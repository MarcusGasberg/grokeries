import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import {
  createRootRoute,
  HeadContent,
  Link,
  Outlet,
  Scripts,
} from '@tanstack/react-router'
import appCss from '~/styles/app.css?url'
import * as React from 'react'
import { ZeroProvider } from '@rocicorp/zero/react'
import { Zero } from '@rocicorp/zero'
import { schema } from '../../zero-schema';

export const Route = createRootRoute({
  head: () => ({
    links: [{ rel: 'stylesheet', href: appCss }],
  }),
  component: RootComponent,
})



const z = new Zero({
  userID: 'anon',
  server: 'http://localhost:4848',
  schema,
});

function RootComponent() {
  return (
    <RootDocument>
      <ZeroProvider zero={z}>
        <Outlet />
      </ZeroProvider>
    </RootDocument>
  )
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <head>
        <HeadContent />
      </head>
      <body>
        <div className="p-2 flex gap-2 text-lg">
          <Link to="/">Index</Link>
          <Link to="/about">About</Link>
          <Link to="/groceries">Groceries</Link>
        </div>

        {children}
        <TanStackRouterDevtools position="bottom-right" />
        <Scripts />
      </body>
    </html>
  )
}

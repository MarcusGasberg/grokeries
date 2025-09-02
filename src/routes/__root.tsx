import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import {
  createRootRoute,
  HeadContent,
  Link,
  Outlet,
  Scripts,
} from '@tanstack/react-router'
import appCss from '@/styles/app.css?url'
import * as React from 'react'
import { ZeroProvider } from '@rocicorp/zero/react'
import { Zero } from '@rocicorp/zero'
import { schema } from '@/zero/zero-schema';

export const Route = createRootRoute({
  head: () => ({
    links: [{ rel: 'stylesheet', href: appCss }],
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'ztunes',
      },
    ],
  }),
  component: RootComponent,
})


const z = new Zero({
  userID: 'anon',
  server: import.meta.env['VITE_PUBLIC_SERVER'],
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
        {children}
        <TanStackRouterDevtools position="bottom-right" />
        <Scripts />
      </body>
    </html>
  )
}

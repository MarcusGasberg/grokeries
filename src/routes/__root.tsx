import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import {
  createRootRouteWithContext,
  HeadContent,
  Outlet,
  Scripts,
} from "@tanstack/react-router";
import appCss from "@/styles/app.css?url";
import * as React from "react";
import { RouterContext } from "@/router";
import { must } from "@/shared/must";
import { Toaster } from "@/components/ui/toaster";
import "@/lib/i18n";

export const Route = createRootRouteWithContext<RouterContext>()({
  head: () => ({
    links: [{ rel: "stylesheet", href: appCss }],
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        title: "grokeries",
      },
    ],
  }),
  component: RootComponent,
});

function RootComponent() {
  return (
    <RootDocument>
      <Outlet />
    </RootDocument>
  );
}

function RootDocument({ children }: { children: React.ReactNode }) {
  const serverURL = import.meta.env.VITE_PUBLIC_SERVER;
  
  return (
    <html>
      <head>
        {serverURL && <link rel="preconnect" href={serverURL} />}
        <HeadContent />
      </head>
      <body>
        {children}
        <Toaster />
        <TanStackRouterDevtools position="bottom-right" />
        <Scripts />
      </body>
    </html>
  );
}

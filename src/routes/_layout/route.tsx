import { SessionInit } from "@/components/session-init";
import { ZeroInit } from "@/components/zero-init";
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { CookiesProvider } from "react-cookie";

export const getAuthFromHeaders = createServerFn().handler(async () => {});

export const Route = createFileRoute("/_layout")({
  component: RouteComponent,
  staleTime: Infinity,
  ssr: false,
  beforeLoad: async ({ context }) => {
    const { session } = context;

    if (session && !session.data) {
      throw redirect({
        to: "/login",
        search: { redirect: "/settings" },
      });
    }
  },
});

function RouteComponent() {
  return (
    <CookiesProvider>
      <SessionInit>
        <ZeroInit>
          <Outlet />
        </ZeroInit>
      </SessionInit>
    </CookiesProvider>
  );
}

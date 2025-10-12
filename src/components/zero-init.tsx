import { Zero } from "@rocicorp/zero";
import { ZeroProvider } from "@rocicorp/zero/react";
import { useMemo } from "react";
import { useRouter } from "@tanstack/react-router";
import { must } from "@/shared/must";
import { createMutators, Mutators } from "@/zero/mutators";
import { Schema, schema } from "@/zero/zero-schema";

const serverURL = must(
  import.meta.env.VITE_PUBLIC_SERVER,
  "VITE_PUBLIC_SERVER is required",
);

export function ZeroInit({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { session } = router.options.context;

  const opts = useMemo(() => {
    return {
      schema,
      userID: session.data?.userID ?? "anon",
      auth: session.zeroAuth,
      server: serverURL,
      mutators: createMutators(
        session.data?.userID
          ? { sub: session.data.userID, name: session.data.name }
          : undefined,
      ),
      init: (zero: Zero<Schema, Mutators>) => {
        router.update({
          context: {
            ...router.options.context,
            zero,
          },
        });

        router.invalidate();

        preload(zero);
      },
    };
  }, [session.data?.userID, router]);

  return <ZeroProvider {...opts}>{children}</ZeroProvider>;
}

function preload(z: Zero<Schema>) {
  // Delay preload() slightly to avoid blocking UI on first run.
  setTimeout(() => {
    // Preload global grocery items for autocomplete
    // We preload ALL items (English only for Phase 1) sorted by popularity
    // This enables instant autocomplete suggestions without server round-trips
    z.query.globalGroceryItems
      .where("language", "=", "en")
      .orderBy("popularity", "desc")
      .preload({
        ttl: "30m",
      });

    // Preload user's grocery history for personalized suggestions
    // This allows us to boost items the user frequently adds
    z.query.userGroceryHistory
      .orderBy("lastUsedAt", "desc")
      .preload({
        ttl: "10m",
      });
  }, 1_000);
}

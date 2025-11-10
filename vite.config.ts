import viteReact from "@vitejs/plugin-react";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { nitro } from "nitro/vite";

import tsConfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

export default defineConfig({
  server: {
    port: 3000,
  },
  plugins: [
    tsConfigPaths({
      projects: ["./tsconfig.json"],
    }),
    tailwindcss(),
    nitro({
      config: {
        preset: "aws-lambda",
        compatibilityDate: "2025-10-18",
      },
    }),
    tanstackStart({
      spa: {
        enabled: true,
      },
      prerender: {
        enabled: false,
      },
      srcDirectory: "src",
    }),
    viteReact(),
  ],
});

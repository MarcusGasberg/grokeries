import { tanstackStart } from "@tanstack/react-start/plugin/vite";
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
    tanstackStart({
      target: "aws_lambda",
      customViteReactPlugin: true,
      spa: {
        enabled: true,
      },
      tsr: {
        srcDirectory: "src",
      },
    }),
  ],
});

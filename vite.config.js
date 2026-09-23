import { fileURLToPath } from "node:url";
import { vitePlugin as remix } from "@remix-run/dev";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

export default defineConfig({
  /* `~` points at app/, matching jsconfig.json so the editor and the bundler
     agree. Remix's TypeScript template gets this from vite-tsconfig-paths;
     spelling it out keeps this repo dependency-free and explicit. */
  resolve: {
    alias: {
      "~": fileURLToPath(new URL("./app", import.meta.url)),
    },
  },

  plugins: [
    tailwindcss(),
    remix({
      future: {
        v3_fetcherPersist: true,
        v3_relativeSplatPath: true,
        v3_throwAbortReason: true,
        v3_singleFetch: true,
        v3_lazyRouteDiscovery: true,
      },
    }),
  ],
});

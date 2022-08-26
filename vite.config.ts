import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [svelte()],
  server: {
    port: 6969
  },
  define: {
    global: {}
  },
  build: {
    target: "esnext",
    commonjsOptions: {
      transformMixedEsModules: true
    }
  },
  resolve: {
    alias: {
      // polyfills
      "readable-stream": "vite-compatible-readable-stream",
      stream: "vite-compatible-readable-stream"
    }
  }
});

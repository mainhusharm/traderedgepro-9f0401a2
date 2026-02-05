import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  // Bump Vite cache dir to avoid stale optimized deps when switching React versions
  cacheDir: mode === "development" ? "node_modules/.vite-react18" : undefined,
  optimizeDeps: {
    // Force dependency re-optimization in dev so React/Reconciler changes take effect immediately
    force: mode === "development",
  },
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // Dedupe three.js to prevent multiple instances warning
      "three": path.resolve(__dirname, "node_modules/three"),
    },
    dedupe: ["three"],
  },
}));

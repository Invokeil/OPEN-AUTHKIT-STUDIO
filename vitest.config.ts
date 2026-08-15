import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
    },
  },
  test: {
    root: path.resolve(import.meta.dirname),
    include: ["tests/**/*.test.ts"],
    environment: "node",
  },
});

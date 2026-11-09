import path from "node:path"
import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          react: ["react", "react-dom", "react-router"],
          motion: ["motion"],
          ui: ["radix-ui", "cmdk", "lucide-react"],
          query: ["@tanstack/react-query"],
          table: ["@tanstack/react-table", "@dnd-kit/core", "@dnd-kit/sortable", "@dnd-kit/utilities"],
        },
      },
    },
  },
  test: {
    environment: "node",
  },
} as Parameters<typeof defineConfig>[0])

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(() => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        // Découpage manuel des vendors pour réduire le bundle initial
        // et permettre au navigateur de mettre en cache séparément les
        // librairies qui changent rarement (React, UI, etc.).
        manualChunks(id) {
          if (!id.includes("node_modules")) return;

          if (id.includes("react-dom") || id.includes("/react/") || id.includes("react-router")) {
            return "vendor-react";
          }
          if (id.includes("@radix-ui") || id.includes("cmdk") || id.includes("vaul")) {
            return "vendor-radix";
          }
          if (id.includes("@supabase")) {
            return "vendor-supabase";
          }
          if (id.includes("framer-motion")) {
            return "vendor-motion";
          }
          if (id.includes("recharts") || id.includes("d3-")) {
            return "vendor-charts";
          }
          if (id.includes("i18next")) {
            return "vendor-i18n";
          }
          if (id.includes("livekit")) {
            return "vendor-livekit";
          }
          if (id.includes("@tanstack")) {
            return "vendor-query";
          }
          return "vendor";
        },
      },
    },
  },
}));

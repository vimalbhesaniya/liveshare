import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  // Custom domain: https://liveshare.dev/
  base: "/",

  server: {
    host: "::",
    port: 8080,
    proxy: {
      "/api": {
        target: process.env.VITE_BACKEND_URL || "http://localhost:3000",
        changeOrigin: true,
      },
      "/socket.io": {
        target: process.env.VITE_BACKEND_URL || "http://localhost:3000",
        ws: true,
      },
    },
  },

  plugins: [react()],

  worker: {
    format: "es",
  },

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  build: {
    minify: "esbuild",

    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom", "react-router-dom"],
          editor: ["@monaco-editor/react"],
        },
      },
    },

    chunkSizeWarningLimit: 1000,
    sourcemap: false,
  },

  optimizeDeps: {
    include: ["react", "react-dom", "react-router-dom"],
  },
});

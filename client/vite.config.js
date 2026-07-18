import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// In dev, the client runs on :5173 and proxies /api to the Express server on :4000.
// In production, set VITE_API_URL to your deployed backend URL (see .env.example).
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:4000",
        changeOrigin: true,
      },
    },
  },
});

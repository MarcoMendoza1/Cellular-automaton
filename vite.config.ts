import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  server: {
    port: 8080,
    open: true,
    allowedHosts: ['75e7-189-157-168-131.ngrok-free.app'],
  },
});

import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ["@aurelglyph/css", "@aurelglyph/react", "@aurelglyph/react/styles.css"]
  },
  server: {
    fs: {
      allow: ["../.."]
    }
  }
});

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// `vite build --mode pages` builds for GitHub Pages, which serves the site
// from https://<user>.github.io/AIE312-Webtech_Project/ instead of the root.
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  base: mode === "pages" ? "/AIE312-Webtech_Project/" : "/",
}));

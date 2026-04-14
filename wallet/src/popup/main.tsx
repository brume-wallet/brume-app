import "@/polyfills";
import "@fontsource/geist-sans/400.css";
import "@fontsource/geist-sans/500.css";
import "@fontsource/geist-sans/600.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router-dom";
import "@/styles/globals.css";
import { App } from "./App";
import { applyUiSurfaceClass, readUiSurface } from "./lib/ui-shell";

void readUiSurface().then(applyUiSurfaceClass);

document.documentElement.classList.remove("dark");

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </StrictMode>,
);

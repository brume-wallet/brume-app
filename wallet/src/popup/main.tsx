import "@/polyfills";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router-dom";
import "@/styles/globals.css";
import { App } from "./App";
import { applyUiSurfaceClass, readUiSurface } from "./lib/ui-shell";

void readUiSurface().then(applyUiSurfaceClass);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </StrictMode>,
);

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "maplibre-gl/dist/maplibre-gl.css";

async function enableMocking() {
  // Always enable MSW in dev mode; in production only if VITE_ENABLE_MOCKS=true
  if (!import.meta.env.DEV && import.meta.env.VITE_ENABLE_MOCKS !== "true") {
    return;
  }
  const { worker } = await import("./mocks/browser");
  return worker.start({ onUnhandledRequest: "bypass" });
}

enableMocking().then(() => {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
});

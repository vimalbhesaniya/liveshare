import "./i18n"; // Initialize i18n before anything else
import { createRoot } from "react-dom/client";
import { Analytics } from "@vercel/analytics/react";
import { injectSpeedInsights } from "@vercel/speed-insights";
import App from "./App.tsx";
import Maintenance from "./pages/Maintenance";
import "./index.css";

// Inject Vercel Speed Insights for performance monitoring
injectSpeedInsights();

// Register service worker for browser notifications
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('Service Worker registered successfully:', registration);
      })
      .catch((error) => {
        console.error('Service Worker registration failed:', error);
      });
  });
}

function isMaintenanceModeEnabled(value: unknown) {
  if (typeof value !== "string") return false;
  const v = value.trim().toLowerCase();
  return v === "true" || v === "1" || v === "yes" || v === "on";
}

const maintenanceMode = isMaintenanceModeEnabled(
  import.meta.env.VITE_MAINTENANCE_MODE
);
const maintenanceMessage = import.meta.env.VITE_MAINTENANCE_MESSAGE;

createRoot(document.getElementById("root")!).render(
  <>
    {maintenanceMode ? (
      <Maintenance message={maintenanceMessage} />
    ) : (
      <App />
    )}
    <Analytics />
  </>
);

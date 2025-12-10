import { createRoot } from "react-dom/client";
import { Analytics } from "@vercel/analytics/react";
import { injectSpeedInsights } from "@vercel/speed-insights";
import App from "./App.tsx";
import "./index.css";

// Inject Vercel Speed Insights for performance monitoring
injectSpeedInsights();

createRoot(document.getElementById("root")!).render(
  <>
    <App />
    <Analytics />
  </>
);

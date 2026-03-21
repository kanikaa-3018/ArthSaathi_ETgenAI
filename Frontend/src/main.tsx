import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

/**
 * Minimal entry for the tooling PR. Later PRs replace this with the full app shell.
 */
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <p style={{ margin: 0 }}>ArthSaathi — frontend scaffold</p>
  </StrictMode>,
);

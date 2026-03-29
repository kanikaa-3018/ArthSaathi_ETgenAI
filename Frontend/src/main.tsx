import { createRoot } from "react-dom/client";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import App from "./App.tsx";
import "lenis/dist/lenis.css";
import "./index.css";

/** Register once before any component uses ScrollTrigger-driven GSAP animations. */
gsap.registerPlugin(ScrollTrigger);

createRoot(document.getElementById("root")!).render(<App />);

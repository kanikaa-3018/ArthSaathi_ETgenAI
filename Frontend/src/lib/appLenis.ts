import type Lenis from "lenis";
import { ScrollTrigger } from "gsap/ScrollTrigger";

let appLenis: Lenis | null = null;

/** Set from App root effect; cleared on teardown. */
export function setAppLenis(instance: Lenis | null): void {
  appLenis = instance;
}

export function getAppLenis(): Lenis | null {
  return appLenis;
}

/** Route changes must move Lenis + native scroll together. */
export function scrollDocumentToTop(): void {
  if (appLenis) {
    appLenis.scrollTo(0, { immediate: true });
  } else {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }
  requestAnimationFrame(() => {
    ScrollTrigger.refresh();
  });
}

import { useEffect, useRef } from "react";
import { gsap } from "gsap";

const INTERACTIVE_SELECTOR = "a, button, [data-cursor]";

export default function CursorReticle() {
  const reticleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = reticleRef.current;
    if (!el) return;

    const xTo = gsap.quickTo(el, "x", { duration: 0.06, ease: "none" });
    const yTo = gsap.quickTo(el, "y", { duration: 0.06, ease: "none" });

    const onMove = (e: MouseEvent) => {
      xTo(e.clientX);
      yTo(e.clientY);
    };

    const corners = el.querySelectorAll<HTMLElement>(".reticle-corner");

    const onEnterInteractive = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const interactive = target.closest(INTERACTIVE_SELECTOR);
      if (!interactive) return;
      const rel = e.relatedTarget as Node | null;
      if (rel && interactive.contains(rel)) return;

      const cursorType = target
        .closest("[data-cursor]")
        ?.getAttribute("data-cursor");

      if (cursorType === "loss") {
        gsap.to(corners, {
          borderColor: "hsl(0 90% 68%)",
          rotation: 45,
          duration: 0.15,
        });
        gsap.to(el, { rotation: 45, duration: 0.15 });
      } else if (cursorType === "gain") {
        gsap.to(corners, { borderColor: "hsl(160 67% 52%)", duration: 0.15 });
      } else if (target.closest("a, button")) {
        gsap.to(corners[0], {
          x: 6,
          y: 6,
          borderColor: "hsl(213 60% 56%)",
          duration: 0.15,
        });
        gsap.to(corners[1], {
          x: -6,
          y: 6,
          borderColor: "hsl(213 60% 56%)",
          duration: 0.15,
        });
        gsap.to(corners[2], {
          x: 6,
          y: -6,
          borderColor: "hsl(213 60% 56%)",
          duration: 0.15,
        });
        gsap.to(corners[3], {
          x: -6,
          y: -6,
          borderColor: "hsl(213 60% 56%)",
          duration: 0.15,
        });
      }
    };

    const onLeaveInteractive = (e: MouseEvent) => {
      const from = e.target as Element | null;
      if (!from?.closest?.(INTERACTIVE_SELECTOR)) return;
      const interactive = from.closest(INTERACTIVE_SELECTOR);
      if (!interactive) return;
      const rel = e.relatedTarget as Node | null;
      if (rel && interactive.contains(rel)) return;

      gsap.to(corners, {
        x: 0,
        y: 0,
        borderColor: "hsl(220 6% 40%)",
        rotation: 0,
        duration: 0.15,
      });
      gsap.to(el, { rotation: 0, duration: 0.15 });
    };

    window.addEventListener("mousemove", onMove);
    document.addEventListener("mouseover", onEnterInteractive);
    document.addEventListener("mouseout", onLeaveInteractive);

    return () => {
      window.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseover", onEnterInteractive);
      document.removeEventListener("mouseout", onLeaveInteractive);
      gsap.killTweensOf([el, ...corners]);
    };
  }, []);

  const cornerStyle = "absolute w-[10px] h-[10px] reticle-corner";
  const borderColor = "hsl(220 6% 40%)";

  return (
    <div
      ref={reticleRef}
      id="cursor-reticle"
      className="fixed top-0 left-0 pointer-events-none z-[9998]"
      style={{ transform: "translate(-50%, -50%)" }}
    >
      {/* Top-left */}
      <div
        className={cornerStyle}
        style={{
          top: -14,
          left: -14,
          borderTop: `1.5px solid ${borderColor}`,
          borderLeft: `1.5px solid ${borderColor}`,
        }}
      />
      {/* Top-right */}
      <div
        className={cornerStyle}
        style={{
          top: -14,
          left: 4,
          borderTop: `1.5px solid ${borderColor}`,
          borderRight: `1.5px solid ${borderColor}`,
        }}
      />
      {/* Bottom-left */}
      <div
        className={cornerStyle}
        style={{
          top: 4,
          left: -14,
          borderBottom: `1.5px solid ${borderColor}`,
          borderLeft: `1.5px solid ${borderColor}`,
        }}
      />
      {/* Bottom-right */}
      <div
        className={cornerStyle}
        style={{
          top: 4,
          left: 4,
          borderBottom: `1.5px solid ${borderColor}`,
          borderRight: `1.5px solid ${borderColor}`,
        }}
      />
    </div>
  );
}

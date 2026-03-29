import {
  useRef,
  useState,
  type FocusEventHandler,
  type MouseEventHandler,
  type ReactNode,
} from "react";

interface Position {
  x: number;
  y: number;
}

export interface SpotlightCardProps {
  children: ReactNode;
  className?: string;
  spotlightColor?: string;
}

/** ReactBits SpotlightCard — cursor-following radial highlight; merge styles via className. */
export default function SpotlightCard({
  children,
  className = "",
  spotlightColor = "rgba(255, 255, 255, 0.08)",
}: SpotlightCardProps) {
  const divRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [position, setPosition] = useState<Position>({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  const handleMouseMove: MouseEventHandler<HTMLDivElement> = (e) => {
    if (!divRef.current || isFocused) return;

    const rect = divRef.current.getBoundingClientRect();
    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const handleFocusCapture: FocusEventHandler<HTMLDivElement> = () => {
    setIsFocused(true);
    setOpacity(0.32);
  };

  const handleBlurCapture: FocusEventHandler<HTMLDivElement> = (e) => {
    const next = e.relatedTarget as Node | null;
    if (next && divRef.current?.contains(next)) return;
    setIsFocused(false);
    setOpacity(0);
  };

  const handleMouseEnter = () => {
    setOpacity(0.32);
  };

  const handleMouseLeave = () => {
    if (
      typeof document !== "undefined" &&
      divRef.current?.contains(document.activeElement)
    ) {
      return;
    }
    if (!isFocused) setOpacity(0);
  };

  return (
    <div
      ref={divRef}
      onMouseMove={handleMouseMove}
      onFocusCapture={handleFocusCapture}
      onBlurCapture={handleBlurCapture}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`relative overflow-hidden ${className}`}
    >
      <div
        className="pointer-events-none absolute inset-0 transition-opacity duration-500 ease-in-out"
        style={{
          opacity,
          background: `radial-gradient(circle at ${position.x}px ${position.y}px, ${spotlightColor}, transparent 80%)`,
        }}
      />
      {children}
    </div>
  );
}

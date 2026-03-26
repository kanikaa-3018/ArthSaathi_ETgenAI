import { useState, useEffect, useRef } from "react";

interface FeeCounterProps {
  annualDrag: number;
}

export function FeeCounter({ annualDrag }: FeeCounterProps) {
  const [amount, setAmount] = useState(0);
  const startRef = useRef(Date.now());
  const perSecond = annualDrag / (365.25 * 24 * 60 * 60);

  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = (Date.now() - startRef.current) / 1000;
      setAmount(elapsed * perSecond);
    }, 100);
    return () => clearInterval(interval);
  }, [perSecond]);

  return (
    <div className="flex items-center gap-2">
      <span
        className="font-body text-xs"
        style={{ color: "hsl(var(--text-tertiary))" }}
      >
        Since you opened this report:
      </span>
      <span className="font-mono-dm text-base font-medium text-negative">
        ₹{amount.toFixed(2)} lost to fees
      </span>
    </div>
  );
}

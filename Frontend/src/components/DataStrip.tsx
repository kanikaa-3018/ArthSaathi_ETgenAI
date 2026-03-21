import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

const fundData = [
  { name: 'HDFC TOP 100', ter: '1.71%' },
  { name: 'MIRAE ASSET LARGE CAP', ter: '1.58%' },
  { name: 'SBI BLUE CHIP', ter: '1.74%' },
  { name: 'ICICI PRU BLUECHIP', ter: '1.66%' },
  { name: 'AXIS LONG TERM', ter: '1.62%' },
  { name: 'PARAG PARIKH FLEXI', ter: '0.63%' },
  { name: 'DSP MIDCAP', ter: '1.88%' },
  { name: 'NIPPON INDIA GROWTH', ter: '1.79%' },
];

export default function DataStrip() {
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const width = track.scrollWidth / 2;
    gsap.to(track, {
      x: -width,
      duration: 60,
      ease: 'none',
      repeat: -1,
    });
  }, []);

  const items = [...fundData, ...fundData];

  return (
    <div className="h-[36px] bg-bg-secondary border-y border-border-faint overflow-hidden flex items-center">
      <div ref={trackRef} className="flex items-center whitespace-nowrap">
        {items.map((f, i) => (
          <span key={i} className="flex items-center">
            <span className="font-syne text-[12px] text-text-muted uppercase">{f.name}</span>
            <span className="font-syne text-[12px] text-text-muted mx-1">· TER</span>
            <span className="font-mono text-[12px] text-negative font-medium">{f.ter}</span>
            <span className="text-text-muted mx-4">·</span>
          </span>
        ))}
      </div>
    </div>
  );
}

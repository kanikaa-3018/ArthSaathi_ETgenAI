import { useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

interface StatItem {
  target: number;
  prefix: string;
  suffix: string;
  decimals: number;
  label: string;
  context?: string;
  color: string;
  large?: boolean;
}

const stats: StatItem[] = [
  { target: 40697, prefix: '₹', suffix: '', decimals: 0, label: 'average annual fee drain', context: 'Across portfolios analyzed', color: 'text-negative', large: true },
  { target: 45.2, prefix: '', suffix: '%', decimals: 1, label: 'avg fund overlap', color: 'text-warning' },
  { target: 22.6, prefix: '₹', suffix: 'L', decimals: 1, label: '10-yr wealth gap', color: 'text-negative' },
  { target: 41, prefix: '', suffix: '/100', decimals: 0, label: 'avg health score', color: 'text-warning' },
];

export default function NumbersSection() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const numEls = sectionRef.current?.querySelectorAll('.stat-num');
      if (!numEls) return;

      numEls.forEach((el, i) => {
        const s = stats[i];
        const obj = { val: 0 };
        ScrollTrigger.create({
          trigger: el,
          start: 'top 70%',
          onEnter: () => {
            gsap.to(obj, {
              val: s.target,
              duration: 1.4,
              ease: 'power2.out',
              delay: i * 0.18,
              snap: { val: s.decimals === 0 ? 1 : 0.1 },
              onUpdate: () => {
                const formatted = s.decimals === 0
                  ? Math.round(obj.val).toLocaleString('en-IN')
                  : obj.val.toFixed(s.decimals);
                el.textContent = s.prefix + formatted + s.suffix;
              },
            });
          },
          once: true,
        });
      });
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="py-14 md:py-20" style={{ background: 'hsl(220 20% 10%)', borderTop: '1px solid hsl(220 10% 14%)', borderBottom: '1px solid hsl(220 10% 14%)' }}>
      <div className="max-w-[1080px] mx-auto px-6 md:px-10">
        <p className="font-syne font-medium text-xs text-text-muted uppercase tracking-[3px] text-center mb-10">BY THE NUMBERS</p>

        <div className="grid grid-cols-1 md:grid-cols-[1.7fr_1fr_1fr] md:grid-rows-2">
          {/* Cell 1 — large, spans 2 rows */}
          <div className="md:row-span-2 p-7 border-b md:border-b-0 md:border-r border-border-faint">
            <p className={`stat-num font-mono font-bold text-[36px] md:text-[48px] ${stats[0].color}`} data-cursor="loss">₹0</p>
            <p className="font-syne text-[13px] text-text-tertiary mt-2">{stats[0].label}</p>
            <p className="font-syne text-xs text-text-muted mt-1">{stats[0].context}</p>
          </div>

          {/* Cell 2 */}
          <div className="p-7 border-b border-border-faint md:border-r">
            <p className={`stat-num font-mono font-bold text-[36px] ${stats[1].color}`} data-cursor="loss">0%</p>
            <p className="font-syne text-[13px] text-text-tertiary mt-2">{stats[1].label}</p>
          </div>

          {/* Cell 3 */}
          <div className="p-7 border-b border-border-faint">
            <p className={`stat-num font-mono font-bold text-[36px] ${stats[2].color}`} data-cursor="loss">₹0L</p>
            <p className="font-syne text-[13px] text-text-tertiary mt-2">{stats[2].label}</p>
          </div>

          {/* Cell 4 — below cell 2 */}
          <div className="p-7 md:col-span-2">
            <p className={`stat-num font-mono font-bold text-[36px] ${stats[3].color}`}>0/100</p>
            <p className="font-syne text-[13px] text-text-tertiary mt-2">{stats[3].label}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

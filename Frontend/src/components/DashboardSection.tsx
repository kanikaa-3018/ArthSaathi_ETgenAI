import { useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { LineChart, Line, ResponsiveContainer, CartesianGrid, RadialBarChart, RadialBar } from 'recharts';

const wealthData = [
  { yr: 0, current: 10, optimised: 10 },
  { yr: 1, current: 10.8, optimised: 11.2 },
  { yr: 2, current: 11.2, optimised: 12.6 },
  { yr: 3, current: 11.5, optimised: 14.1 },
  { yr: 4, current: 11.3, optimised: 15.8 },
  { yr: 5, current: 11.0, optimised: 17.7 },
  { yr: 6, current: 10.8, optimised: 19.8 },
];

const healthData = [{ value: 41, fill: 'hsl(44 96% 56%)' }];

export default function DashboardSection() {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(cardRef.current, { y: 20 }, {
        y: -40,
        ease: 'none',
        scrollTrigger: {
          trigger: cardRef.current,
          scrub: true,
          start: 'top bottom',
          end: 'bottom top',
        },
      });
    }, cardRef);
    return () => ctx.revert();
  }, []);

  return (
    <section className="py-14 md:py-20">
      <div className="max-w-[1080px] mx-auto px-6 md:px-10 text-center">
        <p className="font-syne font-medium text-[12px] text-text-muted uppercase tracking-[3px]">SAMPLE OUTPUT</p>
        <h2 className="font-fraunces text-text-primary text-[28px] md:text-[34px] mt-2 mb-10" style={{ fontVariationSettings: "'opsz' 72, 'wght' 700" }}>
          Every blind spot. Exposed.
        </h2>
      </div>

      <div ref={cardRef} className="max-w-[960px] mx-auto rounded-xl overflow-hidden" style={{ background: 'hsl(220 20% 10%)', border: '1px solid hsl(220 10% 20%)' }}>
        {/* Titlebar */}
        <div className="h-11 flex items-center justify-between px-[18px]" style={{ background: 'hsl(220 18% 12%)', borderBottom: '1px solid hsl(220 10% 14%)' }}>
          <div className="flex gap-1.5">
            <div className="w-[9px] h-[9px] rounded-full" style={{ background: 'hsla(0,90%,68%,0.9)' }} />
            <div className="w-[9px] h-[9px] rounded-full" style={{ background: 'hsla(44,96%,56%,0.9)' }} />
            <div className="w-[9px] h-[9px] rounded-full" style={{ background: 'hsla(160,67%,52%,0.9)' }} />
          </div>
          <span className="font-syne text-[12px] text-text-muted">ArthSaathi — Portfolio Report</span>
          <span className="font-syne text-xs text-text-muted">Analyzed: Just now</span>
        </div>

        {/* Metrics grid */}
        <div className="grid grid-cols-1 md:grid-cols-[200px_1fr_1fr] gap-4 p-5">
          {/* Health ring */}
          <div className="flex flex-col items-center justify-center md:row-span-2">
            <div className="relative">
              <RadialBarChart width={200} height={160} innerRadius="70%" outerRadius="100%" data={healthData} startAngle={90} endAngle={-270} barSize={8}>
                <RadialBar dataKey="value" cornerRadius={4} background={{ fill: 'hsl(220 15% 14%)' }} />
              </RadialBarChart>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-mono font-bold text-[28px] text-warning">41</span>
                <span className="font-mono text-[13px] text-text-muted">/ 100</span>
                <span className="font-syne font-semibold text-xs text-warning tracking-wider mt-1">C</span>
              </div>
            </div>
          </div>

          {/* Fee cell */}
          <div>
            <p className="font-syne text-xs text-text-muted tracking-[2px] uppercase">ANNUAL FEE DRAIN</p>
            <p className="font-mono font-semibold text-[24px] text-negative mt-1">₹40,697</p>
            <p className="font-syne text-[12px] text-text-muted">1.82% of portfolio</p>
          </div>

          {/* Overlap cell */}
          <div>
            <p className="font-syne text-xs text-text-muted tracking-[2px] uppercase">PORTFOLIO OVERLAP</p>
            <p className="font-mono font-semibold text-[24px] text-warning mt-1">45.2%</p>
            <p className="font-syne text-[12px] text-text-muted">High redundancy</p>
          </div>
        </div>

        {/* Wealth chart */}
        <div className="px-[18px] pb-5">
          <ResponsiveContainer width="100%" height={130}>
            <LineChart data={wealthData}>
              <CartesianGrid stroke="hsl(220 10% 14%)" strokeDasharray="3 3" />
              <Line type="monotone" dataKey="current" stroke="hsl(0 90% 68%)" strokeDasharray="5 3" strokeWidth={1.5} dot={false} />
              <Line type="monotone" dataKey="optimised" stroke="hsl(160 67% 52%)" strokeWidth={1.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
          <div className="flex items-center gap-5 mt-2 justify-center">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: 'hsl(0 90% 68%)' }} />
              <span className="font-syne text-xs text-text-muted">Current</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: 'hsl(160 67% 52%)' }} />
              <span className="font-syne text-xs text-text-muted">Optimised</span>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

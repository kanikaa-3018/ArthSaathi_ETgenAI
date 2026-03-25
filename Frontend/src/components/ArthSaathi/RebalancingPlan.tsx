import { useScrollReveal } from '@/hooks/useScrollReveal';
import { Info, Sparkles } from 'lucide-react';

interface RebalancingPlanProps {
  content: string;
  aiGenerated: boolean;
}

export function RebalancingPlan({ content, aiGenerated }: RebalancingPlanProps) {
  const { ref, visible } = useScrollReveal();

  // Parse markdown content
  const lines = content.split('\n');
  const rendered: JSX.Element[] = [];

  lines.forEach((line, i) => {
    const trimmed = line.trim();
    if (!trimmed) {
      rendered.push(<div key={i} className="h-2" />);
    } else if (trimmed.startsWith('## ')) {
      rendered.push(
        <h3 key={i} className="font-body text-lg font-bold text-primary-light mt-8 mb-3">
          {trimmed.slice(3)}
        </h3>
      );
    } else if (/^\d+\./.test(trimmed)) {
      const match = trimmed.match(/^(\d+)\.\s(.+)/);
      if (match) {
        rendered.push(
          <p key={i} className="font-body text-[15px] leading-relaxed mb-2" style={{ color: 'hsl(var(--text-secondary))' }}>
            <span className="font-mono-dm text-accent mr-2">{match[1]}.</span>
            {match[2]}
          </p>
        );
      }
    } else if (i === 0) {
      // Disclaimer
      rendered.push(
        <p key={i} className="font-body text-xs italic flex items-start gap-2" style={{ color: 'hsl(var(--text-tertiary))' }}>
          <Info size={14} className="flex-shrink-0 mt-0.5" />
          {trimmed}
        </p>
      );
    } else {
      rendered.push(
        <p key={i} className="font-body text-[15px] leading-relaxed" style={{ color: 'hsl(var(--text-secondary))', lineHeight: 1.75 }}>
          {trimmed}
        </p>
      );
    }
  });

  return (
    <div ref={ref} className="card-arth overflow-hidden" style={{
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(20px)',
      transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
    }}>
      {/* Gradient top border */}
      <div className="h-[3px]" style={{
        background: 'linear-gradient(90deg, hsl(var(--accent)), hsl(var(--positive)))',
      }} />

      <div className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <h2 className="font-display text-[22px] font-semibold text-primary-light">Rebalancing Plan</h2>
          {aiGenerated ? (
            <span className="flex items-center gap-1 text-xs font-medium font-body px-2.5 py-1 rounded" style={{
              background: 'rgba(74,144,217,0.15)',
              color: 'hsl(var(--accent))',
            }}>
              <Sparkles size={12} /> AI Generated
            </span>
          ) : (
            <span className="text-xs font-body" style={{ color: 'hsl(var(--text-tertiary))' }}>
              Generated using rules-based analysis
            </span>
          )}
        </div>

        <div>{rendered}</div>
      </div>
    </div>
  );
}

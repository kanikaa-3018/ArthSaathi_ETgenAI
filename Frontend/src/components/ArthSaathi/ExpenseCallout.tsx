import { useScrollReveal } from '@/hooks/useScrollReveal';
import { useCountUp } from '@/hooks/useCountUp';
import { compactINR } from '@/lib/format';

interface ExpenseCalloutProps {
  projected10yr: number;
  potentialSavings10yr: number;
}

export function ExpenseCallout({ projected10yr, potentialSavings10yr }: ExpenseCalloutProps) {
  const { ref, visible } = useScrollReveal();
  const lossVal = useCountUp(projected10yr, 2000, visible);
  const saveVal = useCountUp(potentialSavings10yr, 2000, visible);

  return (
    <div
      ref={ref}
      className="card-arth p-6 text-center border border-red-500/20"
      style={{
        background: 'linear-gradient(135deg, rgba(248,113,113,0.08), rgba(248,113,113,0.03))',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(20px)',
        transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      <p className="font-body text-lg font-medium" style={{ color: 'hsl(var(--text-secondary))' }}>
        Your portfolio is losing
      </p>
      <p className="font-mono-dm text-[56px] font-bold text-negative negative-glow mt-2">
        {compactINR(lossVal)}
      </p>
      <p className="font-body text-lg font-medium" style={{ color: 'hsl(var(--text-secondary))' }}>
        to expense fees over the next 10 years
      </p>

      <div className="mx-auto max-w-[200px] h-px my-6 border-t border-white/[0.06]" />

      <p className="font-body text-base" style={{ color: 'hsl(var(--text-secondary))' }}>
        Switching to direct plans saves
      </p>
      <p className="font-mono-dm text-[28px] font-semibold text-positive positive-glow mt-1">
        {compactINR(saveVal)}
      </p>
    </div>
  );
}

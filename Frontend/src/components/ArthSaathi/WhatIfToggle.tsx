import { ArrowRightLeft } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

interface WhatIfToggleProps {
  enabled: boolean;
  onToggle: (val: boolean) => void;
  regularCount: number;
  savingsAnnual: number;
  /** Shown when toggle is on, e.g. fee savings and health score delta */
  savingsSummary?: string;
}

export function WhatIfToggle({
  enabled,
  onToggle,
  regularCount,
  savingsAnnual,
  savingsSummary,
}: WhatIfToggleProps) {
  if (regularCount === 0) return null;

  return (
    <div
      className={cn(
        'card-arth p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 sticky top-12 z-30 border border-white/[0.06]',
        enabled && 'border-2 what-if-shimmer',
      )}
      style={{
        borderLeft: enabled ? '3px solid hsl(var(--positive))' : '3px solid hsl(var(--bg-tertiary))',
        background: enabled
          ? 'linear-gradient(135deg, rgba(52,211,153,0.08), rgba(52,211,153,0.02))'
          : 'hsla(220, 20%, 10%, 0.95)',
        backdropFilter: 'blur(12px)',
        transition: 'background 0.3s ease',
      }}
    >
      <div className="flex items-center gap-3 min-w-0">
        <ArrowRightLeft
          size={18}
          className="shrink-0"
          style={{ color: enabled ? 'hsl(var(--positive))' : 'hsl(var(--text-tertiary))' }}
        />
        <div className="min-w-0">
          <p className="font-body text-sm font-medium text-primary-light">
            What if you switched {regularCount} Regular plan{regularCount > 1 ? 's' : ''} to Direct?
          </p>
          {!enabled ? (
            <p className="font-body text-xs" style={{ color: 'hsl(var(--text-tertiary))' }}>
              Toggle to see how your numbers change — saves ₹{savingsAnnual.toLocaleString('en-IN')}/year
            </p>
          ) : (
            <>
              <p className="font-body text-xs text-positive">
                Showing projected numbers after switching to Direct plans
              </p>
              {savingsSummary ? (
                <p className="font-body text-xs mt-1 font-medium" style={{ color: 'hsl(var(--positive))' }}>
                  {savingsSummary}
                </p>
              ) : null}
            </>
          )}
        </div>
      </div>
      <Switch checked={enabled} onCheckedChange={onToggle} className="shrink-0" />
    </div>
  );
}

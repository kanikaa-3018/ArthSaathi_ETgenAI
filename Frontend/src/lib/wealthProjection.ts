/**
 * Backend uses British spelling (optimised_path, optimised_xirr).
 * Mock UI data uses American spelling (optimized_*). Normalize for charts.
 */
type PathPoint = { year: number; value: number };

type RawAssumptions = {
  current_xirr?: number;
  optimized_xirr?: number;
  optimised_xirr?: number;
  ter_savings_applied?: number;
  alpha_improvement_applied?: number;
};

type RawWealthProjection = {
  current_path?: PathPoint[] | null;
  optimized_path?: PathPoint[] | null;
  optimised_path?: PathPoint[] | null;
  assumptions?: RawAssumptions | null;
};

export function normalizeWealthProjectionForChart(wp: RawWealthProjection | null | undefined): {
  currentPath: PathPoint[];
  optimizedPath: PathPoint[];
  assumptions: {
    current_xirr: number;
    optimized_xirr: number;
    ter_savings_applied: number;
    alpha_improvement_applied: number;
  };
} {
  const currentPath = wp?.current_path?.length ? wp.current_path : [];
  const optimizedPath =
    wp?.optimized_path?.length ? wp.optimized_path : wp?.optimised_path?.length ? wp.optimised_path : [];

  const a = wp?.assumptions;
  const assumptions = {
    current_xirr: a?.current_xirr ?? 0,
    optimized_xirr: a?.optimized_xirr ?? a?.optimised_xirr ?? 0,
    ter_savings_applied: a?.ter_savings_applied ?? 0,
    alpha_improvement_applied: a?.alpha_improvement_applied ?? 0,
  };

  return { currentPath, optimizedPath, assumptions };
}

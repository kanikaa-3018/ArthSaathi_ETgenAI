"""
Projection Agent — wealth gap simulation (Section 4.5).
Takes portfolio XIRR, TER savings, and alpha improvement to generate 20-year paths.
Never accesses CAS data directly.
"""
from typing import Any, Dict, List

from app.agents.base import BaseAgent
from app.utils import format_inr

ALPHA_IMPROVEMENT = 0.005   # Conservative 0.5% alpha improvement from switching to index


class ProjectionAgent(BaseAgent):
    """Generates wealth gap projection: current vs optimised path over 20 years."""

    agent_name = "projection_agent"

    async def run(
        self,
        current_value: float,
        portfolio_xirr: float,
        expense_summary: Dict[str, Any],
        funds: List[Dict[str, Any]],
    ) -> Dict[str, Any]:
        self.emit_running("Projecting wealth trajectories…", step=1, total_steps=2)

        # ── Optimised XIRR ───────────────────────────────────────────────────
        total_value = current_value if current_value > 0 else 1
        total_annual_drag = expense_summary.get("total_annual_drag") or 0
        total_potential_savings = expense_summary.get("total_potential_annual_savings") or 0

        weighted_ter_savings = total_potential_savings / total_value if total_value else 0

        # Optimised rate = current XIRR + TER savings rate + alpha improvement
        optimised_xirr = portfolio_xirr + weighted_ter_savings + ALPHA_IMPROVEMENT

        # ── Generate paths: years 0-20 ──────────────────────────────────────
        current_path: List[Dict[str, Any]] = []
        optimised_path: List[Dict[str, Any]] = []

        for yr in range(21):
            current_val = current_value * ((1 + portfolio_xirr) ** yr)
            optimised_val = current_value * ((1 + optimised_xirr) ** yr)
            current_path.append({"year": yr, "value": round(current_val, 2)})
            optimised_path.append({"year": yr, "value": round(optimised_val, 2)})

        gap_10 = optimised_path[10]["value"] - current_path[10]["value"]
        gap_20 = optimised_path[20]["value"] - current_path[20]["value"]

        self.emit_progress("Computing wealth gap…", step=2, total_steps=2)
        self.emit_completed(
            f"Optimised path saves {format_inr(gap_10)} over 10 years",
            severity="success" if gap_10 > 0 else "info",
        )

        return {
            "current_path": current_path,
            "optimised_path": optimised_path,
            "gap_at_10yr": round(gap_10, 2),
            "gap_at_20yr": round(gap_20, 2),
            "assumptions": {
                "current_xirr": round(portfolio_xirr, 4),
                "optimised_xirr": round(optimised_xirr, 4),
                "ter_savings_applied": round(weighted_ter_savings, 4),
                "alpha_improvement_applied": ALPHA_IMPROVEMENT,
            },
        }

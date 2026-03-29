/**
 * Mirrors backend/app/agents/overlap.py::_is_equity so the overlap UI
 * does not hide a matrix that the backend already computed.
 */
export function isEquityForOverlap(category: string | undefined): boolean {
  const cat = (category || "").toLowerCase();

  if (
    [
      "liquid fund",
      "overnight fund",
      "money market",
      "gilt fund",
      "credit risk",
      "corporate bond",
      "banking and psu",
      "ultra short duration",
      "low duration",
      "short duration",
      "medium to long duration",
      "dynamic bond",
      "floater",
    ].some((k) => cat.includes(k))
  ) {
    return false;
  }

  return (
    cat.includes("equity") ||
    cat.includes("elss") ||
    cat.includes("large cap") ||
    cat.includes("mid cap") ||
    cat.includes("small cap") ||
    cat.includes("flexi cap") ||
    cat.includes("multi cap") ||
    cat.includes("focused") ||
    cat.includes("contra") ||
    cat.includes("value") ||
    cat.includes("large & mid") ||
    cat.includes("hybrid") ||
    cat.includes("balanced") ||
    cat.includes("arbitrage") ||
    cat.includes("index fund") ||
    cat.includes("sectoral") ||
    cat.includes("thematic") ||
    cat.includes("equity savings") ||
    cat.includes("multi asset") ||
    cat.includes("dynamic asset") ||
    cat.includes("solution oriented") ||
    cat.includes("retirement fund") ||
    cat.includes("children")
  );
}

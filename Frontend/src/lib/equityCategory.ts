/**
 * Mirrors backend/app/agents/overlap.py::_is_equity so the overlap UI
 * does not hide a matrix that the backend already computed.
 */
export function isEquityForOverlap(category: string | undefined): boolean {
  const cat = (category || "").toLowerCase();
  const looksEquity =
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
    cat.includes("large & mid");
  if (!looksEquity) return false;
  if (cat.includes("debt") || cat.includes("liquid")) return false;
  return true;
}

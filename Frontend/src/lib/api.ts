const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

export const api = {
  analyze: `${API_BASE}/api/analyze`,
  analyzeTest: `${API_BASE}/api/analyze/test`,
  sample: `${API_BASE}/api/sample`,
  health: `${API_BASE}/api/health`,
};

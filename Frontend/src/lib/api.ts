const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

export const api = {
  analyze: `${API_BASE}/api/analyze`,
  analyzeTest: `${API_BASE}/api/analyze/test`,
  sample: `${API_BASE}/api/sample`,
  health: `${API_BASE}/api/health`,
  chat: `${API_BASE}/api/chat`,
  goalsCalculate: `${API_BASE}/api/goals/calculate`,
  taxInsights: `${API_BASE}/api/tax/insights`,
  authRegister: `${API_BASE}/api/auth/register`,
  authLogin: `${API_BASE}/api/auth/login`,
  authMe: `${API_BASE}/api/auth/me`,
};

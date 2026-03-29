import { useNavigate, Link, useLocation } from "react-router-dom";
import { ReportSections } from "@/components/ArthSaathi/ReportSections";
import { mockData } from "@/data/mockData";
import { useSession } from "@/context/session-context";

export default function Demo() {
  const navigate = useNavigate();
  const location = useLocation();
  const { session, loading: sessionLoading } = useSession();
  const showSignInNudge = !sessionLoading && !session;

  return (
    <div className="min-h-screen bg-primary-dark">
      <div className="max-w-[1120px] mx-auto px-4 pb-8">
        <ReportSections
          data={mockData}
          topSlot={
            <div className="space-y-2">
              <div
                className="card-arth px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                style={{ background: "rgba(52, 211, 153, 0.06)" }}
              >
                <div>
                  <p className="section-label">Sample Experience</p>
                  <p
                    className="font-body text-sm"
                    style={{ color: "hsl(var(--text-secondary))" }}
                  >
                    Demo Mode is using curated sample portfolio data for
                    presentation reliability.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate("/analyze")}
                  className="font-body text-xs px-3 py-1.5 rounded-md transition-colors"
                  style={{
                    color: "hsl(var(--text-secondary))",
                    border: "1px solid rgba(255,255,255,0.1)",
                    background: "transparent",
                  }}
                >
                  Switch to Upload Flow
                </button>
              </div>
              {showSignInNudge && (
                <div
                  className="px-4 py-2 text-center rounded-lg"
                  style={{
                    background: "rgba(74, 144, 217, 0.06)",
                    border: "1px solid rgba(74, 144, 217, 0.1)",
                  }}
                >
                  <p
                    className="font-syne text-xs"
                    style={{ color: "hsl(var(--text-secondary))" }}
                  >
                    Want to analyze your own portfolio?{" "}
                    <Link
                      to="/login"
                      state={{ from: location.pathname }}
                      className="text-accent hover:underline font-semibold"
                    >
                      Sign in
                    </Link>{" "}
                    and upload your CAS statement.
                  </p>
                </div>
              )}
            </div>
          }
          footerLabel="ArthSaathi Demo (Sample Dataset) — UI Preview for ET AI Hackathon 2026"
          showFallbacks={{
            benchmarkUnavailable: true,
            overlapUnavailable: true,
            projectionUnavailable: false,
          }}
        />
      </div>
    </div>
  );
}

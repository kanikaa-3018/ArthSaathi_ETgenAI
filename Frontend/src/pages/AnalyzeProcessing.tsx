import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchEventSource } from "@microsoft/fetch-event-source";
import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { AgentDAG } from "@/components/ArthSaathi/AgentDAG";
import { AgentPanel } from "@/components/ArthSaathi/AgentPanel";
import { useAnalysis } from "@/context/analysis-context";
import { api } from "@/lib/api";
import type { AgentEvent, AnalysisData, ApiErrorPayload } from "@/types/analysis";

/** After the dialog appears, time before auto-navigate to report */
const AUTO_CONTINUE_MS = 5000;
/** How long the full agent panel stays visible (no overlay) after the pipeline finishes */
const REVIEW_SECONDS_BEFORE_DIALOG = 5;

export default function AnalyzeProcessing() {
  const navigate = useNavigate();
  const { state, startAnalysis, pushEvent, setResult, setError } = useAnalysis();
  const [viewMode, setViewMode] = useState<"list" | "dag">("list");
  const [showCompletion, setShowCompletion] = useState(false);
  const [completionMeta, setCompletionMeta] = useState<{ processingMs: number } | null>(null);
  /** Countdown while you review the agent list (before overlay dialog) */
  const [reviewSecondsLeft, setReviewSecondsLeft] = useState<number | null>(null);
  /** Countdown while dialog is open (until auto-navigate) */
  const [secondsLeft, setSecondsLeft] = useState(Math.ceil(AUTO_CONTINUE_MS / 1000));
  const navigateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const manualSkipRef = useRef(false);

  useEffect(() => {
    const controller = new AbortController();

    const run = async () => {
      if (state.mode === "upload" && (!state.file || !state.password)) {
        navigate("/analyze/error?code=INTERNAL_ERROR");
        return;
      }

      startAnalysis();

      const onErrorEvent = (payload: ApiErrorPayload) => {
        setError(payload);
        navigate(`/analyze/error?code=${payload.error_code || "INTERNAL_ERROR"}`);
      };
      let errorHandled = false;

      const parseHttpError = async (response: Response): Promise<ApiErrorPayload> => {
        try {
          const body = await response.json();
          if (body?.detail?.error_code) {
            return {
              status: "error",
              error_code: body.detail.error_code,
              message: body.detail.message || "Request failed.",
            };
          }
        } catch {
          // Fall through to generic mapping.
        }
        return {
          status: "error",
          error_code:
            response.status === 413
              ? "FILE_TOO_LARGE"
              : response.status === 415
                ? "INVALID_FILE_TYPE"
                : "INTERNAL_ERROR",
          message: "Could not start analysis.",
        };
      };

      try {
        await fetchEventSource(state.mode === "sample" ? api.analyzeTest : api.analyze, {
          method: state.mode === "sample" ? "GET" : "POST",
          body:
            state.mode === "sample"
              ? undefined
              : (() => {
                  const formData = new FormData();
                  formData.append("file", state.file as File);
                  formData.append("password", state.password);
                  return formData;
                })(),
          signal: controller.signal,
          async onopen(response) {
            if (response.ok) return;
            const payload = await parseHttpError(response);
            errorHandled = true;
            onErrorEvent(payload);
            throw new Error(payload.error_code);
          },
          onmessage(event) {
            if (event.event === "agent_update") {
              pushEvent(JSON.parse(event.data) as AgentEvent);
              return;
            }

            if (event.event === "result") {
              const result = JSON.parse(event.data) as AnalysisData;
              setResult(result);
              setCompletionMeta({ processingMs: result.processing_time_ms ?? 0 });
              // Let the full agent panel stay visible (no dim / no dialog) for REVIEW_SECONDS_BEFORE_DIALOG
              setReviewSecondsLeft(REVIEW_SECONDS_BEFORE_DIALOG);
              return;
            }

            if (event.event === "error") {
              let parsed: unknown;
              try {
                parsed = JSON.parse(event.data);
              } catch {
                const fallbackError: ApiErrorPayload = {
                  status: "error",
                  error_code: "INTERNAL_ERROR",
                  message: "An unexpected error occurred while processing the analysis.",
                };
                errorHandled = true;
                onErrorEvent(fallbackError);
                return;
              }

              const raw: Record<string, unknown> =
                parsed !== null &&
                typeof parsed === "object" &&
                !Array.isArray(parsed)
                  ? (parsed as Record<string, unknown>)
                  : {};
              const errorCode =
                typeof raw.error_code === "string" && raw.error_code.length > 0
                  ? raw.error_code
                  : "INTERNAL_ERROR";
              const message =
                (typeof raw.message === "string" && raw.message.length > 0 && raw.message) ||
                (typeof raw.error === "string" && raw.error.length > 0 && raw.error) ||
                "An unexpected error occurred while processing the analysis.";

              const errorPayload: ApiErrorPayload = {
                status: "error",
                error_code: errorCode,
                message,
              };

              errorHandled = true;
              onErrorEvent(errorPayload);
            }
          },
          onerror(err) {
            if (controller.signal.aborted) return;
            const fallbackError: ApiErrorPayload = {
              status: "error",
              error_code: "INTERNAL_ERROR",
              message: err instanceof Error ? err.message : "Streaming failed",
            };
            errorHandled = true;
            onErrorEvent(fallbackError);
            throw err;
          },
        });
      } catch {
        if (controller.signal.aborted || errorHandled) return;
        const fallbackError: ApiErrorPayload = {
          status: "error",
          error_code: "INTERNAL_ERROR",
          message: "Could not connect to analysis stream.",
        };
        onErrorEvent(fallbackError);
      }
    };

    void run();

    return () => {
      controller.abort();
    };
  }, [navigate, pushEvent, setError, setResult, startAnalysis, state.file, state.mode, state.password]);

  const goToReport = () => {
    manualSkipRef.current = true;
    setReviewSecondsLeft(null);
    if (navigateTimerRef.current) {
      clearTimeout(navigateTimerRef.current);
      navigateTimerRef.current = null;
    }
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
    navigate("/analyze/report");
  };

  /** After result: countdown reviewSecondsLeft → 0, then show completion dialog */
  useEffect(() => {
    if (reviewSecondsLeft === null) return;
    if (reviewSecondsLeft === 0) {
      setShowCompletion(true);
      setReviewSecondsLeft(null);
      return;
    }
    const t = window.setTimeout(() => {
      setReviewSecondsLeft((s) => (s === null ? null : s - 1));
    }, 1000);
    return () => clearTimeout(t);
  }, [reviewSecondsLeft]);

  /** Countdown + auto-navigate after dialog is visible */
  useEffect(() => {
    if (!showCompletion) return;

    manualSkipRef.current = false;
    const totalSec = Math.max(1, Math.ceil(AUTO_CONTINUE_MS / 1000));
    setSecondsLeft(totalSec);

    countdownRef.current = window.setInterval(() => {
      setSecondsLeft((s) => Math.max(0, s - 1));
    }, 1000);

    navigateTimerRef.current = window.setTimeout(() => {
      if (!manualSkipRef.current) {
        navigate("/analyze/report");
      }
    }, AUTO_CONTINUE_MS);

    return () => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
      }
      if (navigateTimerRef.current) {
        clearTimeout(navigateTimerRef.current);
        navigateTimerRef.current = null;
      }
    };
  }, [showCompletion, navigate]);

  const skipReviewToDialog = () => {
    setReviewSecondsLeft(null);
    setShowCompletion(true);
  };

  return (
    <div className="min-h-screen bg-primary-dark px-4">
      <div className="max-w-[1120px] mx-auto pt-4">
        <button
          onClick={() => navigate("/analyze")}
          className="font-body text-xs px-3 py-1.5 rounded-md transition-colors"
          style={{
            color: "hsl(var(--text-secondary))",
            border: "1px solid rgba(255,255,255,0.1)",
            background: "transparent",
          }}
        >
          ← Back to Upload
        </button>
      </div>

      <div className="min-h-[90vh] flex items-center justify-center relative">
        <div
          className={`w-full max-w-[1120px] transition-opacity duration-300 ${showCompletion ? "opacity-40 pointer-events-none" : ""}`}
        >
          <div className="text-center mb-8">
            <h1 className="font-display text-3xl font-bold text-primary-light">ArthSaathi</h1>
            <p className="font-body text-sm mt-1" style={{ color: "hsl(var(--text-tertiary))" }}>
              (अर्थसाथी)
            </p>
          </div>
          <div
            className="inline-flex rounded-lg p-1 mx-auto mb-6"
            style={{ background: "hsl(var(--bg-tertiary))" }}
          >
            <button
              type="button"
              onClick={() => setViewMode("list")}
              aria-pressed={viewMode === "list"}
              className={cn(
                "px-4 py-1.5 rounded-md text-sm font-medium transition-colors",
                viewMode === "list" ? "bg-white/10 text-primary-light" : "text-secondary-light",
              )}
            >
              List View
            </button>
            <button
              type="button"
              onClick={() => setViewMode("dag")}
              aria-pressed={viewMode === "dag"}
              className={cn(
                "px-4 py-1.5 rounded-md text-sm font-medium transition-colors",
                viewMode === "dag" ? "bg-white/10 text-primary-light" : "text-secondary-light",
              )}
            >
              Pipeline View
            </button>
          </div>
          {viewMode === "list" ? (
            <AgentPanel active={true} mode="live" events={state.agentEvents} />
          ) : (
            <AgentDAG events={state.agentEvents} />
          )}
        </div>

        {reviewSecondsLeft !== null && !showCompletion ? (
          <div
            className="fixed bottom-0 left-0 right-0 z-40 flex flex-col sm:flex-row items-center justify-center gap-3 px-4 py-4"
            style={{
              background: "linear-gradient(180deg, transparent 0%, hsla(220, 25%, 8%, 0.97) 30%)",
              borderTop: "1px solid rgba(74, 144, 217, 0.2)",
            }}
          >
            <p className="font-body text-sm text-center" style={{ color: "hsl(var(--text-secondary))" }}>
              <span className="text-primary-light font-medium">Review the agents above</span> — confirm all 9 steps
              completed. Summary dialog in{" "}
              <span className="font-mono-dm text-accent">{reviewSecondsLeft}</span>s
            </p>
            <button
              type="button"
              onClick={skipReviewToDialog}
              className="font-body text-xs px-4 py-2 rounded-md shrink-0"
              style={{
                color: "hsl(var(--accent))",
                border: "1px solid rgba(74, 144, 217, 0.35)",
                background: "rgba(74, 144, 217, 0.08)",
              }}
            >
              Skip to summary
            </button>
          </div>
        ) : null}

        {showCompletion ? (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
            style={{ background: "rgba(8, 12, 20, 0.72)", backdropFilter: "blur(6px)" }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="completion-title"
          >
            <div
              className="card-arth w-full max-w-md p-8 text-center animate-reveal"
              style={{ border: "1px solid rgba(74, 144, 217, 0.25)" }}
            >
              <div className="flex justify-center mb-4">
                <CheckCircle2 className="w-14 h-14" style={{ color: "hsl(var(--positive))" }} strokeWidth={1.5} />
              </div>
              <h2 id="completion-title" className="font-display text-xl font-semibold text-primary-light">
                All agents completed
              </h2>
              <p className="font-body text-sm mt-2" style={{ color: "hsl(var(--text-secondary))" }}>
                9/9 orchestration steps finished
                {completionMeta != null && completionMeta.processingMs > 0 ? (
                  <span className="block mt-1 font-mono-dm text-xs" style={{ color: "hsl(var(--text-tertiary))" }}>
                    Pipeline time {(completionMeta.processingMs / 1000).toFixed(1)}s
                  </span>
                ) : null}
              </p>
              <p className="font-body text-sm mt-5" style={{ color: "hsl(var(--text-tertiary))" }}>
                Opening your report in{" "}
                <span className="font-mono-dm text-accent">{secondsLeft}</span>s…
              </p>
              <button
                type="button"
                onClick={goToReport}
                className="w-full mt-6 py-3 rounded-lg font-body text-[15px] font-semibold text-white bg-accent-btn transition-all duration-200 hover:-translate-y-px active:scale-[0.98]"
                style={{ boxShadow: "0 4px 12px rgba(74,144,217,0.35)" }}
              >
                View report now
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

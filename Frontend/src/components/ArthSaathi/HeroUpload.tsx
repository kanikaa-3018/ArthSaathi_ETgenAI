import { useState, useRef, DragEvent } from "react";
import { Upload, X, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

type UploadErrorCode =
  | "INVALID_FILE_TYPE"
  | "FILE_TOO_LARGE"
  | "PASSWORD_REQUIRED";

interface HeroUploadProps {
  onAnalyze: (payload: { file: File; password: string }) => void;
  onSampleData: () => void;
  onValidationError?: (errorCode: UploadErrorCode) => void;
  /**
   * `app` — inside AuthGuard shell (sidebar / mobile header). Compact header, no duplicate wordmark.
   * `marketing` — full hero (e.g. dev Index page).
   */
  variant?: "app" | "marketing";
}

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

export function HeroUpload({
  onAnalyze,
  onSampleData,
  onValidationError,
  variant = "marketing",
}: HeroUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState("");
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const setValidationError = (message: string, code: UploadErrorCode) => {
    setError(message);
    onValidationError?.(code);
  };

  const validateAndSetFile = (candidate: File) => {
    const isPdf =
      candidate.type === "application/pdf" ||
      candidate.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      setValidationError(
        "Please upload a PDF CAS statement only.",
        "INVALID_FILE_TYPE",
      );
      return;
    }
    if (candidate.size > MAX_FILE_SIZE_BYTES) {
      setValidationError(
        "File exceeds 10 MB limit. Please upload a smaller CAS PDF.",
        "FILE_TOO_LARGE",
      );
      return;
    }
    setError(null);
    setFile(candidate);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) validateAndSetFile(f);
  };

  const isApp = variant === "app";

  return (
    <section
      className={cn(
        "relative flex w-full flex-col",
        isApp
          ? "px-0 pb-6 pt-0 sm:pb-8 sm:pt-1 md:mx-auto md:max-w-[560px]"
          : "min-h-screen items-center justify-center px-4",
      )}
    >
      <div
        className={cn(
          "absolute inset-0 bg-primary-dark",
          isApp && "rounded-none opacity-90 md:opacity-100",
        )}
      >
        <div
          className="absolute inset-0"
          style={{
            background: isApp
              ? "linear-gradient(180deg, hsl(220 22% 8%) 0%, hsl(220 25% 6%) 55%)"
              : "radial-gradient(ellipse at center, hsl(220 20% 10%) 0%, hsl(220 25% 6%) 70%)",
          }}
        />
        {!isApp ? (
          <div
            className="absolute top-1/4 left-1/3 h-96 w-96 rounded-full opacity-[0.04]"
            style={{
              background:
                "radial-gradient(circle, hsl(213 60% 56%), transparent 70%)",
              filter: "blur(60px)",
            }}
          />
        ) : null}
      </div>

      <div
        className={cn(
          "relative z-10 w-full text-left",
          !isApp && "max-w-[600px] text-center",
        )}
      >
        {isApp ? (
          <>
            <p className="section-label mb-2">Portfolio X-Ray</p>
            <h1
              className="font-fraunces text-[clamp(1.35rem,4.2vw,1.75rem)] leading-snug text-text-primary"
              style={{ fontVariationSettings: "'opsz' 72, 'wght' 700" }}
            >
              Upload your CAS statement
            </h1>
            <p
              className="font-syne mt-2 max-w-[28rem] text-[13px] leading-relaxed sm:text-sm"
              style={{ color: "hsl(var(--text-secondary))" }}
            >
              Password-protected CAMS / KFin PDF. Nine agents run in parallel to
              produce your full report.
            </p>
          </>
        ) : (
          <>
            <h1
              className="font-display text-5xl font-bold tracking-tight text-primary-light"
              style={{ letterSpacing: "-0.02em" }}
            >
              ArthSaathi
            </h1>
            <p
              className="font-body mt-2 text-lg text-tertiary-light"
              style={{ color: "hsl(var(--text-tertiary))" }}
            >
              (अर्थसाथी)
            </p>
            <p
              className="font-body mt-6 text-[17px] leading-relaxed"
              style={{ color: "hsl(var(--text-secondary))" }}
            >
              Your AI-powered financial companion. Upload your CAS statement and
              watch specialized agents analyze your portfolio in real time.
            </p>
          </>
        )}

        <div
          className={cn(
            "card-arth mx-auto text-left",
            isApp ? "mt-6 p-4 sm:mt-8 sm:p-6" : "mt-10 max-w-[500px] p-8",
          )}
          style={{ borderRadius: "16px" }}
        >
          {!file ? (
            <div
              className={cn(
                "flex cursor-pointer flex-col items-center rounded-lg transition-all duration-200",
                isApp ? "p-6 sm:p-8" : "p-8",
              )}
              style={{
                border: dragging
                  ? "2px dashed hsl(var(--accent))"
                  : "2px dashed rgba(255,255,255,0.1)",
                background: dragging ? "rgba(74,144,217,0.15)" : "transparent",
              }}
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => inputRef.current?.click()}
            >
              <Upload
                size={isApp ? 32 : 40}
                style={{ color: "hsl(var(--text-tertiary))" }}
              />
              <p
                className="font-body mt-3 text-center text-sm"
                style={{ color: "hsl(var(--text-secondary))" }}
              >
                Drop your CAS PDF here or tap to browse
              </p>
              <input
                ref={inputRef}
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) validateAndSetFile(f);
                }}
              />
            </div>
          ) : (
            <div
              className="flex items-center gap-3 rounded-lg p-3"
              style={{ background: "hsl(var(--bg-tertiary))" }}
            >
              <FileText size={20} className="flex-shrink-0 text-accent" />
              <div className="min-w-0 flex-1">
                <p className="font-body text-sm text-primary-light truncate">
                  {file.name}
                </p>
                <p
                  className="font-mono-dm text-xs tabular-nums"
                  style={{ color: "hsl(var(--text-tertiary))" }}
                >
                  {(file.size / 1024).toFixed(0)} KB
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setFile(null);
                  setError(null);
                }}
                className="rounded p-1 transition-colors hover:bg-elevated-dark"
              >
                <X size={16} style={{ color: "hsl(var(--text-tertiary))" }} />
              </button>
            </div>
          )}

          <input
            type="password"
            placeholder="Enter password (usually your PAN)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="font-body placeholder:text-tertiary-light mt-4 w-full rounded-lg px-4 py-3 text-sm text-primary-light outline-none transition-all duration-200 focus:accent-glow"
            style={{
              background: "hsl(var(--bg-tertiary))",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "hsl(var(--accent))";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)";
            }}
          />
          <p
            className="font-body mt-2 text-xs"
            style={{ color: "hsl(var(--text-tertiary))" }}
          >
            Your CAS password is typically your PAN number (e.g., ABCDE1234F)
          </p>

          {error ? (
            <p
              className="font-body mt-3 text-xs"
              style={{ color: "hsl(var(--negative))" }}
            >
              {error}
            </p>
          ) : null}

          <button
            type="button"
            onClick={() => {
              if (!file) return;
              if (!password.trim()) {
                setValidationError(
                  "Please enter your CAS password (usually PAN).",
                  "PASSWORD_REQUIRED",
                );
                return;
              }
              setError(null);
              onAnalyze({ file, password: password.trim() });
            }}
            disabled={!file}
            className="bg-accent-btn mt-5 w-full rounded-lg py-3 font-body text-[15px] font-semibold text-white transition-all duration-200 hover:-translate-y-px active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            style={{
              boxShadow: file ? "0 4px 12px rgba(74,144,217,0.3)" : "none",
            }}
          >
            Analyze
          </button>

          <div className="mt-5 flex items-center gap-3">
            <div
              className="h-px flex-1"
              style={{ background: "rgba(255,255,255,0.06)" }}
            />
            <span
              className="rounded-full px-3 py-1 font-body text-xs"
              style={{
                color: "hsl(var(--text-tertiary))",
                background: "hsl(var(--bg-secondary))",
              }}
            >
              or
            </span>
            <div
              className="h-px flex-1"
              style={{ background: "rgba(255,255,255,0.06)" }}
            />
          </div>

          <button
            type="button"
            onClick={onSampleData}
            className="mt-5 w-full rounded-lg py-2.5 font-body text-sm font-medium transition-all duration-200 active:scale-[0.98]"
            style={{
              color: "hsl(var(--text-secondary))",
              border: "1px solid rgba(255,255,255,0.1)",
              background: "transparent",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "hsl(var(--bg-tertiary))";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
            }}
          >
            Try with sample data
          </button>
        </div>
      </div>
    </section>
  );
}

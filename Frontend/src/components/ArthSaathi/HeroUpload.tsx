import { useState, useRef, DragEvent } from 'react';
import { Upload, X, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

type UploadErrorCode = "INVALID_FILE_TYPE" | "FILE_TOO_LARGE" | "PASSWORD_REQUIRED";

interface HeroUploadProps {
  onAnalyze: (payload: { file: File; password: string }) => void;
  onSampleData: () => void;
  onValidationError?: (errorCode: UploadErrorCode) => void;
}

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

export function HeroUpload({ onAnalyze, onSampleData, onValidationError }: HeroUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState('');
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const setValidationError = (message: string, code: UploadErrorCode) => {
    setError(message);
    onValidationError?.(code);
  };

  const validateAndSetFile = (candidate: File) => {
    const isPdf = candidate.type === "application/pdf" || candidate.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      setValidationError("Please upload a PDF CAS statement only.", "INVALID_FILE_TYPE");
      return;
    }
    if (candidate.size > MAX_FILE_SIZE_BYTES) {
      setValidationError("File exceeds 10 MB limit. Please upload a smaller CAS PDF.", "FILE_TOO_LARGE");
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

  return (
    <section className="min-h-screen flex items-center justify-center relative px-4">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-primary-dark">
        <div className="absolute inset-0" style={{
          background: 'radial-gradient(ellipse at center, hsl(220 20% 10%) 0%, hsl(220 25% 6%) 70%)'
        }} />
        <div className="absolute top-1/4 left-1/3 w-96 h-96 rounded-full opacity-[0.04]" style={{
          background: 'radial-gradient(circle, hsl(213 60% 56%), transparent 70%)',
          filter: 'blur(60px)'
        }} />
      </div>

      <div className="relative z-10 text-center max-w-[600px] w-full">
        <h1 className="font-display text-5xl font-bold text-primary-light tracking-tight" style={{ letterSpacing: '-0.02em' }}>
          ArthSaathi
        </h1>
        <p className="font-body text-lg text-tertiary-light mt-2" style={{ color: 'hsl(var(--text-tertiary))' }}>
          (अर्थसाथी)
        </p>
        <p className="font-body text-[17px] mt-6 leading-relaxed" style={{ color: 'hsl(var(--text-secondary))' }}>
          Your AI-powered financial companion. Upload your CAS statement and watch specialized agents analyze your portfolio in real time.
        </p>

        {/* Upload Card */}
        <div className="card-arth mt-10 p-8 max-w-[500px] mx-auto text-left">
          {/* Dropzone */}
          {!file ? (
            <div
              className={cn(
                'rounded-lg p-8 flex flex-col items-center cursor-pointer transition-all duration-200 border-2 border-dashed',
                dragging ? 'border-[hsl(var(--accent))] bg-[rgba(74,144,217,0.15)]' : 'border-white/10 bg-transparent',
              )}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => inputRef.current?.click()}
            >
              <Upload size={40} style={{ color: 'hsl(var(--text-tertiary))' }} />
              <p className="font-body text-sm mt-3" style={{ color: 'hsl(var(--text-secondary))' }}>
                Drop your CAS PDF here or click to browse
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
            <div className="flex items-center gap-3 rounded-lg p-3" style={{ background: 'hsl(var(--bg-tertiary))' }}>
              <FileText size={20} className="text-accent flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-body text-sm text-primary-light truncate">{file.name}</p>
                <p className="font-mono-dm text-xs" style={{ color: 'hsl(var(--text-tertiary))' }}>
                  {(file.size / 1024).toFixed(0)} KB
                </p>
              </div>
              <button
                onClick={() => {
                  setFile(null);
                  setError(null);
                }}
                className="p-1 rounded hover:bg-elevated-dark transition-colors"
              >
                <X size={16} style={{ color: 'hsl(var(--text-tertiary))' }} />
              </button>
            </div>
          )}

          {/* Password */}
          <input
            type="password"
            placeholder="Enter password (usually your PAN)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full mt-4 px-4 py-3 rounded-lg font-body text-sm text-primary-light placeholder:text-tertiary-light outline-none transition-all duration-200 focus-visible:accent-glow bg-[hsl(var(--bg-tertiary))] border border-white/[0.06] focus-visible:border-[hsl(var(--accent))] focus-visible:ring-1 focus-visible:ring-[hsl(var(--accent))]"
          />
          <p className="font-body text-xs mt-2" style={{ color: 'hsl(var(--text-tertiary))' }}>
            Your CAS password is typically your PAN number (e.g., ABCDE1234F)
          </p>

          {error && (
            <p className="font-body text-xs mt-3" style={{ color: 'hsl(var(--negative))' }}>
              {error}
            </p>
          )}

          {/* Analyze Button */}
          <button
            onClick={() => {
              if (!file) return;
              if (!password.trim()) {
                setValidationError("Please enter your CAS password (usually PAN).", "PASSWORD_REQUIRED");
                return;
              }
              setError(null);
              onAnalyze({ file, password: password.trim() });
            }}
            disabled={!file}
            className="w-full mt-5 py-3 rounded-lg font-body text-[15px] font-semibold text-white bg-accent-btn transition-all duration-200 hover:-translate-y-px disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
            style={{
              boxShadow: file ? '0 4px 12px rgba(74,144,217,0.3)' : 'none',
            }}
          >
            Analyze
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 mt-5">
            <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
            <span className="font-body text-xs px-3 py-1 rounded-full" style={{
              color: 'hsl(var(--text-tertiary))',
              background: 'hsl(var(--bg-secondary))',
            }}>or</span>
            <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
          </div>

          {/* Sample Data */}
          <button
            type="button"
            onClick={onSampleData}
            className="w-full mt-5 py-2.5 rounded-lg font-body text-sm font-medium transition-all duration-200 active:scale-[0.98] text-[hsl(var(--text-secondary))] border border-white/10 bg-transparent hover:bg-[hsl(var(--bg-tertiary))]"
          >
            Try with sample data
          </button>
        </div>
      </div>
    </section>
  );
}

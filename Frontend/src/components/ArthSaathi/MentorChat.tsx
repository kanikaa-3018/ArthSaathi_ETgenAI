import { useCallback, useEffect, useRef, useState } from "react";
import { fetchEventSource } from "@microsoft/fetch-event-source";
import { Mic, MicOff, Radio, Send, Sparkles, Volume2, VolumeX } from "lucide-react";
import { api } from "@/lib/api";
import type { AnalysisData } from "@/types/analysis";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";
import { cn } from "@/lib/utils";

type Role = "user" | "assistant";

interface Msg {
  role: Role;
  content: string;
}

const QUICK_PROMPTS = [
  "What should I do first?",
  "Am I diversified enough?",
  "How do I save on fees?",
  "Explain my tax position",
];

function stripMarkdownForSpeech(text: string): string {
  return text
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/^[\s>*-]+/gm, " ")
    .replace(/\s+/g, " ")
    .trim();
}

interface MentorChatProps {
  analysis: AnalysisData;
  /** Use fixed viewport height filling parent (e.g. mobile sheet) */
  variant?: "default" | "sheet";
}

export function MentorChat({ analysis, variant = "default" }: MentorChatProps) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const accRef = useRef("");
  const portfolioContext = analysis as unknown as Record<string, unknown>;

  const { isListening, transcript, isSupported: micSupported, startListening, stopListening } =
    useSpeechRecognition();
  const { speak, stop: stopSpeaking, isSupported: ttsSupported, speaking } = useSpeechSynthesis();

  const analysisKey = `${analysis.processing_time_ms}-${analysis.portfolio_summary.total_funds}-${analysis.portfolio_summary.total_current_value}`;

  useEffect(() => {
    const greeting = `I've analyzed your portfolio (${analysis.portfolio_summary.total_funds} funds, ₹${(
      analysis.portfolio_summary.total_current_value / 1e5
    ).toFixed(2)} L). Ask anything about fees, overlap, taxes, or goals — I'll use your numbers.`;
    setMessages([{ role: "assistant", content: greeting }]);
    setStreaming("");
    setError(null);
    stopSpeaking();
  }, [analysisKey, analysis.portfolio_summary.total_funds, analysis.portfolio_summary.total_current_value, stopSpeaking]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streaming]);

  useEffect(() => {
    if (!isListening || !micSupported) return;
    const id = window.setTimeout(() => stopListening(), 5000);
    return () => window.clearTimeout(id);
  }, [isListening, transcript, micSupported, stopListening]);

  useEffect(() => {
    if (!isListening && transcript) {
      setInput(transcript.trim());
    }
  }, [isListening, transcript]);

  const lastAssistantIndex = messages.reduce((idx, m, i) => (m.role === "assistant" ? i : idx), -1);

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || loading) return;

      stopSpeaking();

      const historyForApi = messages.map((m) => ({ role: m.role, content: m.content }));

      setMessages((prev) => [...prev, { role: "user", content: trimmed }]);
      setInput("");
      setLoading(true);
      setError(null);
      accRef.current = "";
      setStreaming("");

      try {
        await fetchEventSource(api.chat, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "text/event-stream" },
          body: JSON.stringify({
            message: trimmed,
            portfolio_context: portfolioContext,
            conversation_history: historyForApi,
          }),
          async onopen(res) {
            if (!res.ok) {
              const t = await res.text();
              throw new Error(t || `Chat failed (${res.status})`);
            }
          },
          onmessage(ev) {
            if (ev.event === "token") {
              try {
                const j = JSON.parse(ev.data) as { content?: string };
                const chunk = j.content ?? "";
                accRef.current += chunk;
                setStreaming(accRef.current);
              } catch {
                /* ignore */
              }
            }
            if (ev.event === "done") {
              try {
                const j = JSON.parse(ev.data) as { content?: string };
                if (j.content) {
                  accRef.current = j.content;
                  setStreaming(j.content);
                }
              } catch {
                /* ignore */
              }
            }
          },
          onerror(err) {
            throw err;
          },
        });
        const finalText = accRef.current.trim() || "(No response)";
        setMessages((prev) => [...prev, { role: "assistant", content: finalText }]);
        setStreaming("");
        if (autoSpeak && ttsSupported) speak(stripMarkdownForSpeech(finalText));
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not reach mentor chat.");
        setStreaming("");
      } finally {
        setLoading(false);
      }
    },
    [autoSpeak, loading, messages, portfolioContext, speak, stopSpeaking, ttsSupported],
  );

  const shellClass =
    variant === "sheet"
      ? "card-arth flex flex-col overflow-hidden border border-white/10 flex-1 min-h-0 h-full max-h-[85vh]"
      : "card-arth flex flex-col overflow-hidden border border-white/10 min-h-[420px] max-h-[min(720px,calc(100vh-3rem))]";

  return (
    <TooltipProvider>
      <div className={shellClass}>
        <div
          className="flex items-center justify-between gap-2 px-4 py-3 border-b border-white/10"
          style={{ background: "rgba(74, 144, 217, 0.08)" }}
        >
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Sparkles className="h-4 w-4 text-[hsl(var(--accent))] shrink-0" />
            <div className="min-w-0">
              <p className="font-display text-sm font-semibold text-primary-light">AI Mentor</p>
              <p className="font-body text-xs" style={{ color: "hsl(var(--text-secondary))" }}>
                Answers use your portfolio context
              </p>
            </div>
          </div>
          {ttsSupported ? (
            <button
              type="button"
              onClick={() => setAutoSpeak((a) => !a)}
              className="p-2 rounded-lg border border-white/10 shrink-0 transition-colors hover:bg-white/5"
              style={{ color: "hsl(var(--text-secondary))" }}
              aria-label={autoSpeak ? "Disable spoken replies" : "Enable spoken replies"}
            >
              {autoSpeak ? <Volume2 size={18} /> : <VolumeX size={18} />}
            </button>
          ) : null}
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto px-3 py-3 space-y-3 font-body text-sm">
          {messages.map((m, i) => (
            <div
              key={`${i}-${m.role}-${m.content.slice(0, 12)}`}
              className={`rounded-lg px-3 py-2 max-w-[95%] border border-white/[0.06] text-[hsl(var(--text-secondary))] ${
                m.role === "user" ? "ml-auto text-right bg-[rgba(74,144,217,0.25)]" : "mr-auto bg-[hsl(var(--bg-tertiary))]"
              }`}
            >
              <span className="inline-flex items-center gap-1.5">
                {m.content}
                {m.role === "assistant" && speaking && autoSpeak && ttsSupported && i === lastAssistantIndex ? (
                  <Radio className="h-3.5 w-3.5 text-accent shrink-0 animate-pulse" aria-hidden />
                ) : null}
              </span>
            </div>
          ))}
          {streaming && loading ? (
            <div className="mr-auto rounded-lg px-3 py-2 max-w-[95%] border border-white/[0.06] bg-[hsl(var(--bg-tertiary))] text-[hsl(var(--text-secondary))]">
              {streaming}
            </div>
          ) : null}
          {loading && !streaming ? (
            <p className="text-xs" style={{ color: "hsl(var(--text-tertiary))" }}>
              Thinking…
            </p>
          ) : null}
          {error ? <p className="text-xs text-red-400">{error}</p> : null}
          <div ref={bottomRef} />
        </div>

        <div className="px-3 pb-2 flex flex-wrap gap-1.5">
          {QUICK_PROMPTS.map((q) => (
            <button
              key={q}
              type="button"
              disabled={loading}
              onClick={() => void send(q)}
              className="font-body text-xs px-2 py-1 rounded-full border border-white/10 hover:bg-white/5 transition-colors"
              style={{ color: "hsl(var(--text-secondary))" }}
            >
              {q}
            </button>
          ))}
        </div>

        <form
          className="p-3 pt-0 flex gap-2 items-center border-t border-white/10"
          onSubmit={(e) => {
            e.preventDefault();
            void send(isListening ? transcript : input);
          }}
        >
          {micSupported ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  disabled={loading}
                  onClick={() => (isListening ? stopListening() : startListening())}
                  className={cn(
                    "p-2 h-10 w-10 shrink-0 rounded-lg border-white/10 hover:bg-white/5",
                    isListening && "ring-2 ring-red-500/70 ring-offset-2 ring-offset-[hsl(var(--bg-primary))] animate-pulse",
                  )}
                  aria-label={isListening ? "Stop listening" : "Speak"}
                >
                  {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">
                Click to speak
              </TooltipContent>
            </Tooltip>
          ) : null}
          <Input
            value={isListening ? transcript : input}
            onChange={(e) => {
              if (!isListening) setInput(e.target.value);
            }}
            placeholder="Ask ArthSaathi anything…"
            disabled={loading}
            className="font-body text-sm bg-[hsl(var(--bg-tertiary))] border-white/10 flex-1 min-w-0"
          />
          <Button
            type="submit"
            variant="outline"
            disabled={loading || !(isListening ? transcript : input).trim()}
            className="p-2 h-10 w-10 shrink-0 rounded-lg border-white/10 hover:bg-white/5"
            aria-label="Send"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
        <p className="px-3 pb-3 font-body text-xs" style={{ color: "hsl(var(--text-tertiary))" }}>
          Not SEBI-registered advice. Educational use only.
        </p>
      </div>
    </TooltipProvider>
  );
}

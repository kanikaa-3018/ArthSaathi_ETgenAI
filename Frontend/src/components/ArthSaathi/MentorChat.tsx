import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { fetchEventSource } from "@microsoft/fetch-event-source";
import { Mic, MicOff, Send, Sparkles, Volume2, VolumeX } from "lucide-react";
import { api } from "@/lib/api";
import { getAccessToken } from "@/lib/auth";
import type { AnalysisData } from "@/types/analysis";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";
import { renderChatMessageContent } from "@/lib/chatMessageFormat";

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

interface MentorChatProps {
  analysis?: AnalysisData | null;
  /** When true (e.g. public demo, no session), block API calls and prompt sign-in. */
  guestChatLocked?: boolean;
  /**
   * `column` — fill a flex parent with max-height (report sidebar / mobile drawer).
   * `default` — standalone min/max height for floating widget and demo.
   */
  layout?: "default" | "column";
}

export function MentorChat({
  analysis,
  guestChatLocked = false,
  layout = "default",
}: MentorChatProps) {
  const location = useLocation();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastLlmRoute, setLastLlmRoute] = useState<{
    provider: string;
    model: string;
  } | null>(null);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const accRef = useRef("");
  const portfolioContext = (analysis ?? {}) as unknown as Record<
    string,
    unknown
  >;
  const { isListening, transcript, isSupported: sttSupported, startListening, stopListening } = useSpeechRecognition();
  const { speak, stop: stopSpeaking, isSupported: ttsSupported } = useSpeechSynthesis();

  const analysisKey = analysis
    ? `${analysis.processing_time_ms}-${analysis.portfolio_summary.total_funds}-${analysis.portfolio_summary.total_current_value}`
    : "no-analysis";

  useEffect(() => {
    const greeting = guestChatLocked
      ? "Sign in to chat with the AI mentor. The sample report on the left is fully interactive — mentor replies need an account."
      : analysis
        ? `I've analyzed your portfolio (${analysis.portfolio_summary.total_funds} funds, ₹${(
            analysis.portfolio_summary.total_current_value / 1e5
          ).toFixed(
            2,
          )} L). Ask anything about fees, overlap, taxes, or goals — I'll use your numbers.`
        : "Upload a CAS statement to get portfolio-aware answers. For now, ask me general questions about mutual funds, XIRR, or tax optimisation.";
    setMessages([{ role: "assistant", content: greeting }]);
    setStreaming("");
    setError(null);
    setLastLlmRoute(null);
  }, [analysisKey, analysis, guestChatLocked]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streaming]);

  useEffect(() => {
    if (!isListening && transcript) {
      setInput(transcript);
    }
  }, [isListening, transcript]);

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || loading || guestChatLocked) return;

      const historyForApi = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      setMessages((prev) => [...prev, { role: "user", content: trimmed }]);
      setInput("");
      setLoading(true);
      setError(null);
      setLastLlmRoute(null);
      accRef.current = "";
      setStreaming("");
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        Accept: "text/event-stream",
      };
      const token = await getAccessToken();
      if (!token) {
        throw new Error("Session expired. Please log in again.");
      }
      headers.Authorization = `Bearer ${token}`;

      try {
        await fetchEventSource(api.chat, {
          method: "POST",
          headers,
          body: JSON.stringify({
            message: trimmed,
            portfolio_context: portfolioContext,
            conversation_history: historyForApi,
          }),
          async onopen(res) {
            if (!res.ok) {
              if (res.status === 401) {
                throw new Error("Session expired. Please log in again.");
              }
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
                const j = JSON.parse(ev.data) as {
                  content?: string;
                  llm_provider?: string;
                  llm_model?: string;
                };
                if (j.content) {
                  accRef.current = j.content;
                  setStreaming(j.content);
                }
                if (j.llm_provider) {
                  setLastLlmRoute({
                    provider: j.llm_provider,
                    model: j.llm_model ?? "",
                  });
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
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: finalText },
        ]);
        setStreaming("");
        if (autoSpeak && ttsSupported) speak(finalText);
      } catch (e) {
        setError(
          e instanceof Error ? e.message : "Could not reach mentor chat.",
        );
        setStreaming("");
      } finally {
        setLoading(false);
      }
    },
    [autoSpeak, guestChatLocked, loading, messages, portfolioContext, speak, ttsSupported],
  );

  const rootStyle =
    layout === "column"
      ? ({
          minHeight: 0,
          maxHeight: "100%",
          height: "100%",
        } as const)
      : ({
          minHeight: 420,
          maxHeight: "min(720px, calc(100vh - 3rem))",
        } as const);

  return (
    <div
      className={cn(
        "card-arth flex min-h-0 flex-col overflow-hidden border border-white/10",
        layout === "default" && "min-h-[420px]",
      )}
      style={rootStyle}
    >
      <div
        className="flex items-center justify-between gap-2 px-4 py-3 border-b border-white/10"
        style={{ background: "rgba(74, 144, 217, 0.08)" }}
      >
        <Sparkles className="h-4 w-4 text-[hsl(var(--accent))]" />
        <div>
          <p className="font-display text-sm font-semibold text-primary-light">
            AI Mentor
          </p>
          <p
            className="font-body text-xs"
            style={{ color: "hsl(var(--text-tertiary))" }}
          >
            Answers use your portfolio context
          </p>
        </div>
        {ttsSupported ? (
          <button
            type="button"
            onClick={() => setAutoSpeak((a) => !a)}
            className="p-1.5 rounded-md border border-white/10 shrink-0"
            style={{ color: "hsl(var(--text-secondary))" }}
            aria-label={autoSpeak ? "Disable spoken replies" : "Enable spoken replies"}
          >
            {autoSpeak ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>
        ) : null}
      </div>

      <div
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-3 space-y-3 font-body text-sm"
        data-lenis-prevent
      >
        {messages.map((m, i) => (
          <div
            key={`${i}-${m.role}-${m.content.slice(0, 12)}`}
            className={
              m.role === "user"
                ? "ml-auto max-w-[85%] rounded-xl rounded-br-sm px-3 py-2"
                : "max-w-[90%] rounded-xl rounded-bl-sm px-3 py-2"
            }
            style={{
              background:
                m.role === "user"
                  ? "hsl(213 60% 56% / 0.15)"
                  : "hsl(var(--bg-tertiary))",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <div
              className={
                m.role === "user"
                  ? "font-syne text-sm text-text-primary text-left"
                  : "font-syne text-sm text-text-secondary text-left"
              }
            >
              {renderChatMessageContent(m.content)}
            </div>
          </div>
        ))}
        {streaming && loading ? (
          <div
            className="max-w-[90%] rounded-xl rounded-bl-sm px-3 py-2"
            style={{
              background: "hsl(var(--bg-tertiary))",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <div className="font-syne text-sm text-text-secondary text-left">
              {renderChatMessageContent(streaming)}
            </div>
          </div>
        ) : null}
        {loading && !streaming ? (
          <div
            className="max-w-[90%] rounded-xl px-3 py-2"
            style={{ background: "hsl(var(--bg-tertiary))" }}
          >
            <div className="flex items-center gap-1.5">
              <span className="font-syne text-sm text-text-muted">Thinking</span>
              <span className="flex gap-0.5">
                <span
                  className="h-1 w-1 rounded-full bg-text-muted animate-bounce"
                  style={{ animationDelay: "0ms" }}
                />
                <span
                  className="h-1 w-1 rounded-full bg-text-muted animate-bounce"
                  style={{ animationDelay: "150ms" }}
                />
                <span
                  className="h-1 w-1 rounded-full bg-text-muted animate-bounce"
                  style={{ animationDelay: "300ms" }}
                />
              </span>
            </div>
          </div>
        ) : null}
        {error ? <p className="text-xs text-red-400">{error}</p> : null}
        <div ref={bottomRef} />
      </div>

      {guestChatLocked ? (
        <div
          className="mx-3 mb-2 rounded-lg px-3 py-2 text-center font-syne text-xs"
          style={{
            background: "rgba(74, 144, 217, 0.08)",
            border: "1px solid rgba(74, 144, 217, 0.12)",
            color: "hsl(var(--text-secondary))",
          }}
        >
          <Link
            to="/login"
            state={{ from: location.pathname }}
            className="text-accent font-semibold hover:underline"
          >
            Sign in
          </Link>{" "}
          to enable mentor chat.
        </div>
      ) : null}

      <div className="px-3 pb-2 flex gap-1.5 overflow-x-auto scrollbar-none">
        {QUICK_PROMPTS.map((q) => (
          <button
            key={q}
            type="button"
            disabled={loading || guestChatLocked}
            onClick={() => void send(q)}
            className="font-syne shrink-0 whitespace-nowrap rounded-full border border-white/10 px-3 py-1.5 text-xs transition-colors hover:bg-white/5"
            style={{ color: "hsl(var(--text-secondary))" }}
          >
            {q}
          </button>
        ))}
      </div>

      <form
        className="sticky bottom-0 z-10 flex gap-2 border-t border-white/10 px-3 pb-3 pb-safe pt-0"
        style={{ background: "hsl(var(--bg-secondary))" }}
        onSubmit={(e) => {
          e.preventDefault();
          void send(isListening ? transcript : input);
        }}
      >
        {sttSupported ? (
          <Button
            type="button"
            size="icon"
            variant="ghost"
            disabled={guestChatLocked}
            onClick={() => isListening ? stopListening() : startListening()}
            className={`shrink-0 ${isListening ? 'text-red-400 animate-pulse' : ''}`}
            aria-label={isListening ? 'Stop listening' : 'Start listening'}
          >
            {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </Button>
        ) : null}
        <Input
          value={isListening ? transcript : input}
          onChange={(e) => {
            if (!isListening) setInput(e.target.value);
          }}
          placeholder={
            guestChatLocked ? "Sign in to chat…" : "Ask ArthSaathi anything…"
          }
          disabled={loading || guestChatLocked}
          className={`font-body text-sm bg-[hsl(var(--bg-tertiary))] border-white/10 ${isListening ? "ring-1 ring-red-400/50 animate-pulse" : ""}`}
        />
        <Button
          type="submit"
          size="icon"
          disabled={guestChatLocked || loading || !input.trim()}
          className="shrink-0"
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>
      {lastLlmRoute ? (
        <p className="px-3 pb-1 font-mono text-[10px]" style={{ color: "hsl(var(--text-tertiary))" }}>
          Mentor routing: {lastLlmRoute.provider}
          {lastLlmRoute.model ? ` · ${lastLlmRoute.model}` : ""}
        </p>
      ) : null}
      <p
        className="px-3 pb-3 font-body text-xs"
        style={{ color: "hsl(var(--text-tertiary))" }}
      >
        Not SEBI-registered advice. Educational use only.
      </p>
    </div>
  );
}

import { useCallback, useEffect, useRef, useState } from "react";
import { fetchEventSource } from "@microsoft/fetch-event-source";
import { Send, Sparkles } from "lucide-react";
import { api } from "@/lib/api";
import { authHeaders } from "@/lib/auth";
import type { AnalysisData } from "@/types/analysis";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
}

export function MentorChat({ analysis }: MentorChatProps) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const accRef = useRef("");
  const portfolioContext = (analysis ?? {}) as unknown as Record<string, unknown>;

  const analysisKey = analysis
    ? `${analysis.processing_time_ms}-${analysis.portfolio_summary.total_funds}-${analysis.portfolio_summary.total_current_value}`
    : 'no-analysis';

  useEffect(() => {
    const greeting = analysis
      ? `I've analyzed your portfolio (${analysis.portfolio_summary.total_funds} funds, ₹${(
          analysis.portfolio_summary.total_current_value / 1e5
        ).toFixed(2)} L). Ask anything about fees, overlap, taxes, or goals — I'll use your numbers.`
      : "Upload a CAS statement to get portfolio-aware answers. For now, ask me general questions about mutual funds, XIRR, or tax optimisation.";
    setMessages([{ role: "assistant", content: greeting }]);
    setStreaming("");
    setError(null);
  }, [analysisKey, analysis]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streaming]);

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || loading) return;

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
          headers: {
            "Content-Type": "application/json",
            Accept: "text/event-stream",
            ...authHeaders(),
          },
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
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not reach mentor chat.");
        setStreaming("");
      } finally {
        setLoading(false);
      }
    },
    [loading, messages, portfolioContext],
  );

  return (
    <div
      className="card-arth flex flex-col overflow-hidden border border-white/10"
      style={{ minHeight: 420, maxHeight: "min(720px, calc(100vh - 3rem))" }}
    >
      <div
        className="flex items-center gap-2 px-4 py-3 border-b border-white/10"
        style={{ background: "rgba(74, 144, 217, 0.08)" }}
      >
        <Sparkles className="h-4 w-4 text-[hsl(var(--accent))]" />
        <div>
          <p className="font-display text-sm font-semibold text-primary-light">AI Mentor</p>
          <p className="font-body text-[11px]" style={{ color: "hsl(var(--text-tertiary))" }}>
            Answers use your portfolio context
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 font-body text-sm">
        {messages.map((m, i) => (
          <div
            key={`${i}-${m.role}-${m.content.slice(0, 12)}`}
            className={`rounded-lg px-3 py-2 max-w-[95%] ${m.role === "user" ? "ml-auto text-right" : "mr-auto"}`}
            style={{
              background: m.role === "user" ? "rgba(74, 144, 217, 0.25)" : "hsl(var(--bg-tertiary))",
              color: "hsl(var(--text-secondary))",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            {m.content}
          </div>
        ))}
        {streaming && loading ? (
          <div
            className="mr-auto rounded-lg px-3 py-2 max-w-[95%]"
            style={{
              background: "hsl(var(--bg-tertiary))",
              color: "hsl(var(--text-secondary))",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
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
            className="font-body text-[11px] px-2 py-1 rounded-full border border-white/10 hover:bg-white/5 transition-colors"
            style={{ color: "hsl(var(--text-secondary))" }}
          >
            {q}
          </button>
        ))}
      </div>

      <form
        className="p-3 pt-0 flex gap-2 border-t border-white/10"
        onSubmit={(e) => {
          e.preventDefault();
          void send(input);
        }}
      >
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask ArthSaathi anything…"
          disabled={loading}
          className="font-body text-sm bg-[hsl(var(--bg-tertiary))] border-white/10"
        />
        <Button type="submit" size="icon" disabled={loading || !input.trim()} className="shrink-0">
          <Send className="h-4 w-4" />
        </Button>
      </form>
      <p className="px-3 pb-3 font-body text-[10px]" style={{ color: "hsl(var(--text-tertiary))" }}>
        Not SEBI-registered advice. Educational use only.
      </p>
    </div>
  );
}

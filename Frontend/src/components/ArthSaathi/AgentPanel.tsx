import { useState, useEffect, useCallback, useRef } from 'react';
import { Check, AlertTriangle, AlertCircle, Loader2 } from 'lucide-react';
import type { AgentEvent } from '@/types/analysis';

interface AgentState {
  id: string;
  name: string;
  status: 'queued' | 'running' | 'success' | 'warning' | 'critical';
  message: string;
  time?: string;
  flash?: boolean;
}

function normalizeAgentRowStatus(ev: AgentEvent): AgentState['status'] {
  if (ev.status === 'completed') {
    return ev.severity === 'success' ? 'success' : ev.severity;
  }
  if (ev.status === 'error') return 'critical';
  if (ev.status === 'warning') return 'warning';
  return ev.status;
}

const backendAgentOrder = [
  "parser_agent",
  "nav_agent",
  "returns_agent",
  "overlap_agent",
  "cost_agent",
  "benchmark_agent",
  "projection_agent",
  "health_agent",
  "advisor_agent",
] as const;

const backendAgentNameMap: Record<string, string> = {
  parser_agent: "Parser Agent",
  nav_agent: "NAV Agent",
  returns_agent: "Returns Agent",
  overlap_agent: "Overlap Agent",
  cost_agent: "Cost Agent",
  benchmark_agent: "Benchmark Agent",
  projection_agent: "Projection Agent",
  health_agent: "Health Agent",
  advisor_agent: "Advisor Agent",
};

const agentDefs = [
  { id: 'parser', name: 'Parser Agent', delay: 0, duration: 2100, runMsg: 'Parsing CAS statement...', doneMsg: 'Found 6 funds across 2 folios', severity: 'success' as const },
  { id: 'nav', name: 'NAV Agent', delay: 2100, duration: 3400, runMsg: 'Fetching live NAVs for 6 schemes...', doneMsg: 'All NAVs fetched', severity: 'success' as const },
  { id: 'returns', name: 'Returns Agent', delay: 5500, duration: 800, runMsg: 'Computing XIRR for 6 funds...', doneMsg: 'Portfolio XIRR: 12.84%', severity: 'success' as const },
  { id: 'overlap', name: 'Overlap Agent', delay: 5500, duration: 1200, runMsg: 'Analyzing stock overlap...', doneMsg: '45.2% overlap: HDFC Top 100 ↔ ICICI Bluechip', severity: 'warning' as const },
  { id: 'cost', name: 'Cost Agent', delay: 5500, duration: 900, runMsg: 'Analyzing expense ratios...', doneMsg: '₹40,697/year lost to expense fees', severity: 'critical' as const },
  { id: 'benchmark', name: 'Benchmark Agent', delay: 5500, duration: 1500, runMsg: 'Comparing against benchmarks...', doneMsg: '3 of 5 equity funds underperform index', severity: 'warning' as const },
  { id: 'projection', name: 'Projection Agent', delay: 7000, duration: 1000, runMsg: 'Projecting wealth trajectories...', doneMsg: '₹22.6 L gap over 10 years', severity: 'critical' as const },
  { id: 'health', name: 'Health Agent', delay: 8000, duration: 500, runMsg: 'Calculating health score...', doneMsg: 'Health Score: 41/100 — Needs Attention', severity: 'warning' as const },
  { id: 'advisor', name: 'Advisor Agent', delay: 8500, duration: 2000, runMsg: 'Generating AI rebalancing plan...', doneMsg: 'Plan ready — 3 actions identified', severity: 'success' as const },
];

interface AgentPanelProps {
  active: boolean;
  mode: 'live' | 'demo';
  events?: AgentEvent[];
  onComplete?: () => void;
}

export function AgentPanel({ active, mode, events = [], onComplete }: AgentPanelProps) {
  const [agents, setAgents] = useState<AgentState[]>(
    mode === "live"
      ? backendAgentOrder.map((id) => ({ id, name: backendAgentNameMap[id], status: "queued", message: "Queued..." }))
      : agentDefs.map(d => ({ id: d.id, name: d.name, status: 'queued', message: 'Queued...' }))
  );
  const [collapsed, setCollapsed] = useState(false);
  const [totalTime, setTotalTime] = useState('');
  const runIdRef = useRef(0);
  const startTimeRef = useRef<number | null>(null);

  const stableOnComplete = useCallback(() => {
    onComplete?.();
  }, [onComplete]);

  useEffect(() => {
    if (!active) return;
    if (mode !== "demo") return;

    setAgents(agentDefs.map(d => ({ id: d.id, name: d.name, status: 'queued', message: 'Queued...' })));
    setCollapsed(false);
    setTotalTime('');

    runIdRef.current += 1;
    const runId = runIdRef.current;
    const timeoutIds: ReturnType<typeof setTimeout>[] = [];
    const schedule = (fn: () => void, ms: number) => {
      timeoutIds.push(setTimeout(fn, ms));
    };

    const startTime = Date.now();

    agentDefs.forEach(def => {
      schedule(() => {
        if (runId !== runIdRef.current) return;
        setAgents(prev => prev.map(a =>
          a.id === def.id ? { ...a, status: 'running', message: def.runMsg } : a
        ));
      }, def.delay);

      schedule(() => {
        if (runId !== runIdRef.current) return;
        const elapsed = ((Date.now() - startTime - def.delay) / 1000).toFixed(1);
        setAgents(prev => prev.map(a =>
          a.id === def.id ? { ...a, status: def.severity, message: def.doneMsg, time: elapsed + 's', flash: def.severity !== 'success' } : a
        ));
        schedule(() => {
          if (runId !== runIdRef.current) return;
          setAgents(prev => prev.map(a => a.id === def.id ? { ...a, flash: false } : a));
        }, 600);
      }, def.delay + def.duration);
    });

    const maxEnd = Math.max(...agentDefs.map(d => d.delay + d.duration));
    schedule(() => {
      if (runId !== runIdRef.current) return;
      setTotalTime(((Date.now() - startTime) / 1000).toFixed(1));
      schedule(() => {
        if (runId !== runIdRef.current) return;
        setCollapsed(true);
        stableOnComplete();
      }, 800);
    }, maxEnd + 100);

    return () => {
      runIdRef.current += 1;
      timeoutIds.forEach(clearTimeout);
    };
  }, [active, mode, stableOnComplete]);

  useEffect(() => {
    if (!active) return;
    if (mode !== "live") return;

    if (events.length === 0) {
      startTimeRef.current = null;
      setCollapsed(false);
      setTotalTime("");
      setAgents(
        backendAgentOrder.map((id) => ({
          id,
          name: backendAgentNameMap[id],
          status: "queued",
          message: "Queued...",
        })),
      );
      return;
    }

    if (!startTimeRef.current) {
      startTimeRef.current = Date.now();
      setCollapsed(false);
      setTotalTime("");
    }

    // Fold entire history: React 18 often batches many SSE onmessage handlers into one render.
    const lastEventByAgentId = new Map<string, AgentEvent>();
    for (const ev of events) {
      if (ev?.agent) lastEventByAgentId.set(ev.agent, ev);
    }

    setAgents(
      backendAgentOrder.map((id) => {
        const ev = lastEventByAgentId.get(id);
        if (!ev) {
          return { id, name: backendAgentNameMap[id], status: "queued" as const, message: "Queued..." };
        }
        const normalizedStatus = normalizeAgentRowStatus(ev);
        return {
          id,
          name: backendAgentNameMap[id],
          status: normalizedStatus,
          message: ev.message,
          flash: normalizedStatus !== "success" && normalizedStatus !== "queued",
        };
      }),
    );
  }, [active, events, mode]);

  useEffect(() => {
    if (mode !== "live") return;
    const allDone = agents.length > 0 && agents.every((a) => !["queued", "running"].includes(a.status));
    if (!allDone || !startTimeRef.current) return;

    setTotalTime(((Date.now() - startTimeRef.current) / 1000).toFixed(1));
    setCollapsed(true);
    stableOnComplete();
  }, [agents, mode, stableOnComplete]);

  const completed = agents.filter(a => !['queued', 'running'].includes(a.status)).length;
  const progress = (completed / agents.length) * 100;

  if (!active) return null;

  const StatusIcon = ({ status }: { status: AgentState['status'] }) => {
    switch (status) {
      case 'queued': return <span className="w-3 h-3 rounded-full border border-current inline-block" style={{ color: 'hsl(var(--text-tertiary))' }} />;
      case 'running': return <Loader2 size={14} className="animate-spin" style={{ color: 'hsl(var(--accent))' }} />;
      case 'success': return <Check size={14} style={{ color: 'hsl(var(--positive))' }} />;
      case 'warning': return <AlertTriangle size={14} style={{ color: 'hsl(var(--warning))' }} />;
      case 'critical': return <AlertCircle size={14} style={{ color: 'hsl(var(--negative))' }} />;
    }
  };

  const dotColor = (status: AgentState['status']) => {
    switch (status) {
      case 'queued': return 'hsl(var(--text-tertiary))';
      case 'running': return 'hsl(var(--accent))';
      case 'success': return 'hsl(var(--positive))';
      case 'warning': return 'hsl(var(--warning))';
      case 'critical': return 'hsl(var(--negative))';
    }
  };

  if (collapsed && mode === "demo") {
    return (
      <div className="card-arth px-6 py-3 flex items-center justify-between animate-reveal">
        <span className="font-body text-sm" style={{ color: 'hsl(var(--text-secondary))' }}>
          <span className="font-mono-dm" style={{ color: 'hsl(var(--positive))' }}>9/9</span> agents completed · {totalTime}s
        </span>
        <div className="flex gap-1.5">
          {agents.map(a => (
            <span key={a.id} className="w-2 h-2 rounded-full" style={{ background: dotColor(a.status) }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="card-arth p-6 animate-reveal">
      <h3 className="font-body text-sm font-medium text-primary-light mb-5 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full pulse-glow" style={{ background: 'hsl(var(--accent))' }} />
        ArthSaathi Agent Orchestration
      </h3>

      <div className="space-y-1">
        {agents.map((agent) => (
          <div
            key={agent.id}
            className="flex items-center gap-3 px-3 py-2 rounded-lg transition-colors duration-150"
            style={{
              background: agent.flash ? 'rgba(255,255,255,0.05)' : 'transparent',
              animation: agent.flash ? 'agentFlash 0.6s ease-out' : undefined,
            }}
          >
            <span className="w-3 h-3 rounded-full flex-shrink-0" style={{
              background: agent.status === 'queued' ? 'transparent' : dotColor(agent.status),
              border: agent.status === 'queued' ? '1.5px solid hsl(var(--text-tertiary))' : 'none',
              boxShadow: agent.status === 'running' ? '0 0 8px rgba(74,144,217,0.4)' : 'none',
            }} />
            <span className="font-body text-sm font-medium w-32 flex-shrink-0" style={{
              color: agent.status === 'queued' ? 'hsl(var(--text-tertiary))' : 'hsl(var(--text-primary))',
            }}>
              {agent.name}
            </span>
            <span className="flex-1 flex items-center gap-2 min-w-0">
              <StatusIcon status={agent.status} />
              <span className="font-body text-sm truncate" style={{
                color: agent.status === 'warning' ? 'hsl(var(--warning))' :
                       agent.status === 'critical' ? 'hsl(var(--negative))' :
                       agent.status === 'queued' ? 'hsl(var(--text-tertiary))' :
                       'hsl(var(--text-secondary))',
              }}>
                {agent.message}
              </span>
            </span>
            {agent.time && (
              <span className="font-mono-dm text-xs flex-shrink-0" style={{ color: 'hsl(var(--text-tertiary))' }}>
                {agent.time}
              </span>
            )}
          </div>
        ))}
      </div>

      <div className="mt-5 h-1.5 rounded-full overflow-hidden" style={{ background: 'hsl(var(--bg-tertiary))' }}>
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{
            width: `${progress}%`,
            background: 'hsl(var(--accent))',
          }}
        />
      </div>
      <p className="font-mono-dm text-xs mt-2 text-right" style={{ color: 'hsl(var(--text-tertiary))' }}>
        {Math.round(progress)}%
      </p>
    </div>
  );
}

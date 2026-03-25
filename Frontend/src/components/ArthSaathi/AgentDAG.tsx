import { memo, useEffect, useMemo } from "react";
import dagre from "dagre";
import {
  Background,
  Controls,
  Handle,
  Position,
  ReactFlow,
  ReactFlowProvider,
  type Edge,
  type Node,
  type NodeProps,
  useEdgesState,
  useNodesState,
  useReactFlow,
} from "@xyflow/react";
import {
  BarChart3,
  Bot,
  Calculator,
  FileText,
  IndianRupee,
  Heart,
  Layers,
  LineChart,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import type { AgentEvent } from "@/types/analysis";
import { cn } from "@/lib/utils";
import "@xyflow/react/dist/style.css";

const AGENT_ICONS: Record<string, LucideIcon> = {
  parser: FileText,
  nav: TrendingUp,
  returns: Calculator,
  overlap: Layers,
  cost: IndianRupee,
  benchmark: BarChart3,
  projection: LineChart,
  health: Heart,
  advisor: Bot,
};

const AGENT_NODES: { id: string; label: string; description: string }[] = [
  { id: "parser", label: "Parser Agent", description: "Extract portfolio from CAS PDF" },
  { id: "nav", label: "NAV Agent", description: "Fetch current & historical NAVs" },
  { id: "returns", label: "Returns Agent", description: "Compute XIRR per fund + portfolio" },
  { id: "overlap", label: "Overlap Agent", description: "Detect fund overlap via holdings" },
  { id: "cost", label: "Cost Agent", description: "Lookup TER, compute fee drag" },
  { id: "benchmark", label: "Benchmark Agent", description: "Compare vs index alpha" },
  { id: "projection", label: "Projection Agent", description: "Simulate wealth gap" },
  { id: "health", label: "Health Agent", description: "Score portfolio 0–100" },
  { id: "advisor", label: "Advisor Agent", description: "Generate rebalancing plan" },
];

const AGENT_EDGES: { source: string; target: string }[] = [
  { source: "parser", target: "nav" },
  { source: "nav", target: "returns" },
  { source: "nav", target: "overlap" },
  { source: "nav", target: "cost" },
  { source: "returns", target: "benchmark" },
  { source: "cost", target: "projection" },
  { source: "benchmark", target: "projection" },
  { source: "overlap", target: "health" },
  { source: "projection", target: "health" },
  { source: "health", target: "advisor" },
];

export type AgentDAGData = {
  agentId: string;
  label: string;
  description: string;
  status: "queued" | "running" | "completed" | "warning" | "error";
  message: string;
  step: number | null;
  totalSteps: number | null;
};

function eventToStatus(ev: AgentEvent): AgentDAGData["status"] {
  if (ev.status === "error") return "error";
  if (ev.status === "warning") return "warning";
  if (ev.status === "running") return "running";
  if (ev.status === "queued") return "queued";
  if (ev.status === "completed") {
    if (ev.severity === "warning" || ev.severity === "critical") return "warning";
    return "completed";
  }
  return "queued";
}

function latestByAgent(events: AgentEvent[]): Map<string, AgentEvent> {
  const m = new Map<string, AgentEvent>();
  for (const ev of events) {
    const id = String(ev.agent || "").replace(/_agent$/i, "");
    if (id) m.set(id, ev);
  }
  return m;
}

function getLayoutedElements(
  nodes: Node<AgentDAGData>[],
  edges: Edge[],
): { nodes: Node<AgentDAGData>[]; edges: Edge[] } {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: "TB", ranksep: 80, nodesep: 40 });

  nodes.forEach((node) => {
    g.setNode(node.id, { width: 240, height: 80 });
  });
  edges.forEach((edge) => {
    g.setEdge(edge.source, edge.target);
  });

  dagre.layout(g);

  const layoutedNodes = nodes.map((node) => {
    const pos = g.node(node.id);
    return {
      ...node,
      position: { x: pos.x - 120, y: pos.y - 40 },
    };
  });

  return { nodes: layoutedNodes, edges };
}

const AgentNode = memo(function AgentNode({ data }: NodeProps<AgentDAGData>) {
  const Icon = AGENT_ICONS[data.agentId] ?? FileText;
  const statusColors: Record<AgentDAGData["status"], string> = {
    queued: "hsl(var(--bg-tertiary))",
    running: "rgba(59, 130, 246, 0.15)",
    completed: "rgba(52, 211, 153, 0.1)",
    warning: "rgba(251, 191, 36, 0.1)",
    error: "rgba(248, 113, 113, 0.1)",
  };
  const borderColors: Record<AgentDAGData["status"], string> = {
    queued: "rgba(255,255,255,0.08)",
    running: "rgba(59, 130, 246, 0.5)",
    completed: "rgba(52, 211, 153, 0.35)",
    warning: "rgba(251, 191, 36, 0.3)",
    error: "rgba(248, 113, 113, 0.3)",
  };

  return (
    <div
      className={cn(
        "px-4 py-3 rounded-xl min-w-[200px] max-w-[260px]",
        data.status === "running" && "animate-pulse border-2",
      )}
      style={{
        background: statusColors[data.status],
        borderWidth: data.status === "running" ? 2 : 1,
        borderStyle: "solid",
        borderColor: borderColors[data.status],
        transition: "background 0.3s ease, border-color 0.3s ease",
        animation: data.status === "completed" ? "dagCompleted 0.3s ease-out" : undefined,
      }}
    >
      <Handle type="target" position={Position.Top} className="!bg-neutral-600 !w-2 !h-2" />
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 shrink-0 opacity-80 text-primary-light" aria-hidden />
        {data.status === "running" && <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse shrink-0" />}
        {data.status === "completed" && <div className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />}
        {data.status === "warning" && <div className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />}
        {data.status === "error" && <div className="w-2 h-2 rounded-full bg-red-400 shrink-0" />}
        {data.status === "queued" && <div className="w-2 h-2 rounded-full bg-neutral-600 shrink-0" />}
        <span className="font-body text-sm font-medium text-primary-light">{data.label}</span>
      </div>
      {data.message ? (
        <p className="font-body text-xs mt-1 line-clamp-2" style={{ color: "hsl(var(--text-secondary))" }}>
          {data.message}
        </p>
      ) : (
        <p className="font-body text-xs mt-1 line-clamp-2" style={{ color: "hsl(var(--text-tertiary))" }}>
          {data.description}
        </p>
      )}
      {data.step != null && data.totalSteps != null ? (
        <div className="mt-1.5 h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
          <div
            className="h-full rounded-full bg-blue-400 transition-all"
            style={{ width: `${(data.step / Math.max(data.totalSteps, 1)) * 100}%` }}
          />
        </div>
      ) : null}
      <Handle type="source" position={Position.Bottom} className="!bg-neutral-600 !w-2 !h-2" />
    </div>
  );
});

const nodeTypes = { agent: AgentNode };

function FitViewHelper({ signal }: { signal: number }) {
  const { fitView } = useReactFlow();
  useEffect(() => {
    let alive = true;
    const run = () => {
      if (alive) {
        fitView({ padding: 0.2, duration: 220, minZoom: 0.1, maxZoom: 1.5 });
      }
    };
    requestAnimationFrame(() => {
      requestAnimationFrame(run);
    });
    const t = window.setTimeout(run, 160);
    return () => {
      alive = false;
      window.clearTimeout(t);
    };
  }, [fitView, signal]);
  return null;
}

interface AgentDAGProps {
  events: AgentEvent[];
  /** `live` = statuses from SSE; `static` = all steps shown completed (report page). */
  mode?: "live" | "static";
  className?: string;
  /** When `mode` is `static`, disallow zoom/pan (embed in report). Default false. */
  staticInteractive?: boolean;
}

export function AgentDAG({
  events,
  mode = "live",
  className,
  staticInteractive = false,
}: AgentDAGProps) {
  const agentMap = useMemo(() => latestByAgent(events), [events]);

  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    const nodes: Node<AgentDAGData>[] = AGENT_NODES.map((n) => {
      if (mode === "static") {
        return {
          id: n.id,
          type: "agent",
          position: { x: 0, y: 0 },
          data: {
            agentId: n.id,
            label: n.label,
            description: n.description,
            status: "completed" as const,
            message: "Complete",
            step: null,
            totalSteps: null,
          },
        };
      }
      const ev = agentMap.get(n.id);
      const status: AgentDAGData["status"] = ev ? eventToStatus(ev) : "queued";
      const message = ev?.message ?? "";
      return {
        id: n.id,
        type: "agent",
        position: { x: 0, y: 0 },
        data: {
          agentId: n.id,
          label: n.label,
          description: n.description,
          status,
          message,
          step: ev?.step ?? null,
          totalSteps: ev?.total_steps ?? null,
        },
      };
    });

    const statuses: Record<string, AgentDAGData["status"]> = {};
    nodes.forEach((no) => {
      statuses[no.id] = no.data.status;
    });

    const edges: Edge[] = AGENT_EDGES.map((e) => {
      const srcDone = statuses[e.source] === "completed";
      const tgtRun = statuses[e.target] === "running";
      const isGreen = mode === "static" || srcDone;
      return {
        id: `${e.source}-${e.target}`,
        source: e.source,
        target: e.target,
        animated: mode === "live" && srcDone && tgtRun,
        style: {
          stroke: isGreen ? "hsl(160 67% 52%)" : "rgba(255,255,255,0.08)",
          strokeWidth: 2,
        },
      };
    });

    return getLayoutedElements(nodes, edges);
  }, [agentMap, mode]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  const fitSignal = mode === "static" ? 1 : events.length;
  const allowPanZoom = mode === "live" || staticInteractive;

  /** React Flow needs a real height (not just min-height); % heights break inside flex parents. */
  const shellHeight =
    mode === "static"
      ? "min-h-0 h-[300px]"
      : "h-[min(72vh,720px)] min-h-[400px]";

  return (
    <div className={cn("flex flex-col w-full rounded-lg border border-white/[0.06] bg-transparent", shellHeight, className)}>
      <div className="flex-1 min-h-0 w-full overflow-hidden">
        <ReactFlowProvider>
          <div className="h-full w-full min-h-[320px]">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              nodeTypes={nodeTypes}
              minZoom={0.15}
              maxZoom={1.5}
              proOptions={{ hideAttribution: true }}
              nodesDraggable={mode === "live"}
              nodesConnectable={false}
              elementsSelectable={false}
              zoomOnScroll={allowPanZoom}
              panOnDrag={allowPanZoom}
            >
              <Background variant="dots" gap={20} size={1} color="rgba(255,255,255,0.03)" />
              <Controls className="!bg-[hsl(var(--bg-raised))] !border-white/[0.06] [&_button]:!fill-white" />
              <FitViewHelper signal={fitSignal} />
            </ReactFlow>
          </div>
        </ReactFlowProvider>
      </div>
      <p
        className="[@media(hover:none)_and_(pointer:coarse)]:block hidden text-center text-xs py-1.5 shrink-0"
        style={{ color: "hsl(var(--text-tertiary))" }}
      >
        Pinch to zoom
      </p>
    </div>
  );
}

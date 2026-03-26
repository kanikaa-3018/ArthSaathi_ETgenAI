import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useReducer,
} from "react";
import type { PropsWithChildren } from "react";
import type {
  AgentEvent,
  AnalysisData,
  ApiErrorPayload,
} from "@/types/analysis";

export type AnalysisMode = "upload" | "sample";

interface AnalysisState {
  mode: AnalysisMode;
  file: File | null;
  password: string;
  isAnalyzing: boolean;
  agentEvents: AgentEvent[];
  result: AnalysisData | null;
  error: ApiErrorPayload | null;
}

type Action =
  | { type: "SET_UPLOAD"; payload: { file: File; password: string } }
  | { type: "SET_SAMPLE_MODE" }
  | { type: "START_ANALYSIS" }
  | { type: "PUSH_EVENT"; payload: AgentEvent }
  | { type: "SET_RESULT"; payload: AnalysisData }
  | { type: "SET_ERROR"; payload: ApiErrorPayload }
  | { type: "RESET" };

const initialState: AnalysisState = {
  mode: "upload",
  file: null,
  password: "",
  isAnalyzing: false,
  agentEvents: [],
  result: null,
  error: null,
};

function reducer(state: AnalysisState, action: Action): AnalysisState {
  switch (action.type) {
    case "SET_UPLOAD":
      return {
        ...state,
        mode: "upload",
        file: action.payload.file,
        password: action.payload.password,
        error: null,
        result: null,
        agentEvents: [],
      };
    case "SET_SAMPLE_MODE":
      return {
        ...state,
        mode: "sample",
        file: null,
        password: "",
        error: null,
        result: null,
        agentEvents: [],
      };
    case "START_ANALYSIS":
      return {
        ...state,
        isAnalyzing: true,
        error: null,
        result: null,
        agentEvents: [],
      };
    case "PUSH_EVENT":
      return {
        ...state,
        agentEvents: [...state.agentEvents, action.payload],
      };
    case "SET_RESULT":
      return {
        ...state,
        isAnalyzing: false,
        result: action.payload,
      };
    case "SET_ERROR":
      return {
        ...state,
        isAnalyzing: false,
        error: action.payload,
      };
    case "RESET":
      return initialState;
    default:
      return state;
  }
}

interface AnalysisContextValue {
  state: AnalysisState;
  setUpload: (file: File, password: string) => void;
  setSampleMode: () => void;
  startAnalysis: () => void;
  pushEvent: (event: AgentEvent) => void;
  setResult: (result: AnalysisData) => void;
  setError: (error: ApiErrorPayload) => void;
  reset: () => void;
}

const AnalysisContext = createContext<AnalysisContextValue | null>(null);

export function AnalysisProvider({ children }: PropsWithChildren) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Stable dispatch wrappers — MUST NOT depend on `state`.
  // Otherwise every PUSH_EVENT changes deps → AnalyzeProcessing effect re-runs → aborts SSE mid-stream.
  const setUpload = useCallback((file: File, password: string) => {
    dispatch({ type: "SET_UPLOAD", payload: { file, password } });
  }, []);
  const setSampleMode = useCallback(() => {
    dispatch({ type: "SET_SAMPLE_MODE" });
  }, []);
  const startAnalysis = useCallback(() => {
    dispatch({ type: "START_ANALYSIS" });
  }, []);
  const pushEvent = useCallback((event: AgentEvent) => {
    dispatch({ type: "PUSH_EVENT", payload: event });
  }, []);
  const setResult = useCallback((result: AnalysisData) => {
    dispatch({ type: "SET_RESULT", payload: result });
  }, []);
  const setError = useCallback((error: ApiErrorPayload) => {
    dispatch({ type: "SET_ERROR", payload: error });
  }, []);
  const reset = useCallback(() => {
    dispatch({ type: "RESET" });
  }, []);

  const value = useMemo<AnalysisContextValue>(
    () => ({
      state,
      setUpload,
      setSampleMode,
      startAnalysis,
      pushEvent,
      setResult,
      setError,
      reset,
    }),
    [
      state,
      setUpload,
      setSampleMode,
      startAnalysis,
      pushEvent,
      setResult,
      setError,
      reset,
    ],
  );

  return (
    <AnalysisContext.Provider value={value}>
      {children}
    </AnalysisContext.Provider>
  );
}

export function useAnalysis() {
  const ctx = useContext(AnalysisContext);
  if (!ctx) {
    throw new Error("useAnalysis must be used within AnalysisProvider");
  }
  return ctx;
}

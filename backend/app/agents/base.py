"""
BaseAgent — abstract class for every ArthSaathi agent.
Every agent inherits from this. Provides event emission, step tracking, and a run() stub.
"""
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Optional, AsyncGenerator
import asyncio
import time


@dataclass
class AgentEvent:
    """Structured SSE event emitted by an agent."""
    agent: str
    status: str           # queued | running | completed | warning | error
    message: str
    severity: str = "info"  # info | success | warning | critical
    timestamp: float = field(default_factory=time.time)
    step: Optional[int] = None
    total_steps: Optional[int] = None

    def to_dict(self) -> dict:
        return {
            "agent": self.agent,
            "status": self.status,
            "message": self.message,
            "severity": self.severity,
            "timestamp": self.timestamp,
            "step": self.step,
            "total_steps": self.total_steps,
        }


class BaseAgent(ABC):
    """
    Abstract base for all ArthSaathi agents.

    Subclasses must implement `run()`.  Events are placed onto `event_queue`
    which the orchestrator drains and forwards to the frontend via SSE.
    """

    agent_name: str = "base_agent"

    def __init__(self, event_queue: asyncio.Queue):
        self.event_queue = event_queue
        self._step = 0
        self._total_steps = 0

    # ------------------------------------------------------------------
    # Event helpers
    # ------------------------------------------------------------------

    def _emit(
        self,
        status: str,
        message: str,
        severity: str = "info",
        step: Optional[int] = None,
        total_steps: Optional[int] = None,
    ) -> None:
        """Place an event on the shared queue (sync-safe via put_nowait)."""
        event = AgentEvent(
            agent=self.agent_name,
            status=status,
            message=message,
            severity=severity,
            step=step if step is not None else self._step,
            total_steps=total_steps if total_steps is not None else self._total_steps,
        )
        try:
            self.event_queue.put_nowait(event)
        except asyncio.QueueFull:
            pass  # Never block an agent on a full queue

    def emit_queued(self) -> None:
        self._emit("queued", f"{self.agent_name} queued…", severity="info")

    def emit_running(self, message: str, step: int = 1, total_steps: int = 1) -> None:
        self._step = step
        self._total_steps = total_steps
        self._emit("running", message, severity="info", step=step, total_steps=total_steps)

    def emit_progress(self, message: str, step: int, total_steps: int) -> None:
        self._step = step
        self._total_steps = total_steps
        self._emit("running", message, severity="info", step=step, total_steps=total_steps)

    def emit_completed(self, message: str, severity: str = "success") -> None:
        self._emit("completed", message, severity=severity)

    def emit_warning(self, message: str) -> None:
        self._emit("warning", message, severity="warning")

    def emit_error(self, message: str) -> None:
        self._emit("error", message, severity="critical")

    # ------------------------------------------------------------------
    # Abstract interface
    # ------------------------------------------------------------------

    @abstractmethod
    async def run(self, *args, **kwargs):
        """Execute the agent's work. Must be implemented by every subclass."""
        raise NotImplementedError

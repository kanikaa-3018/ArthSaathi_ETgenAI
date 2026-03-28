import React from "react";
import { Link } from "react-router-dom";

interface AppErrorBoundaryState {
  hasError: boolean;
}

export class AppErrorBoundary extends React.Component<
  React.PropsWithChildren,
  AppErrorBoundaryState
> {
  state: AppErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): AppErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error("App rendering error:", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="min-h-screen flex items-center justify-center px-4"
          style={{ background: "hsl(var(--bg-primary))" }}
        >
          <div className="w-full max-w-md rounded-xl border border-white/10 p-6 text-center">
            <h1 className="font-syne text-lg text-text-primary">Something went wrong</h1>
            <p className="font-syne text-sm mt-2 text-text-muted">
              Please retry login. If this keeps happening, refresh the page.
            </p>
            <Link
              to="/login"
              className="inline-flex mt-4 h-10 px-4 items-center justify-center rounded-lg font-syne text-sm text-white"
              style={{ background: "hsl(var(--accent))" }}
            >
              Go to Login
            </Link>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

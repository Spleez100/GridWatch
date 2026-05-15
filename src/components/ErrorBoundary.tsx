import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("GridWatch render error:", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-8 text-center">
          <h1 className="font-mono text-xl font-bold text-primary">
            GridWatch encountered an error
          </h1>
          <p className="max-w-md text-muted-foreground">
            Refresh the page. If the problem persists, check your environment
            variables and Supabase connection.
          </p>
          <button
            type="button"
            className="rounded-md bg-primary px-4 py-2 font-mono text-sm text-primary-foreground"
            onClick={() => window.location.reload()}
          >
            Reload
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

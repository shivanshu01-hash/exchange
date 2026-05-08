"use client";
import { Component, ErrorInfo, ReactNode } from "react";
import { getErrorMessage } from "@/lib/api-client";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ error, errorInfo });
    
    // Log error to error reporting service
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    
    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const errorMessage = getErrorMessage(this.state.error);
      const componentStack = this.state.errorInfo?.componentStack;

      return (
        <div className="flex min-h-[400px] flex-col items-center justify-center rounded-2xl border border-line bg-panel p-8">
          <div className="mb-6 text-center">
            <div className="mb-4 text-6xl">⚠️</div>
            <h2 className="mb-2 text-2xl font-bold">Something went wrong</h2>
            <p className="mb-6 text-slate-400">
              We apologize for the inconvenience. Please try again.
            </p>
          </div>

          <div className="mb-8 w-full max-w-md rounded-lg border border-line bg-ink p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium text-slate-400">Error Details</span>
              <button
                onClick={() => navigator.clipboard.writeText(errorMessage + "\n" + componentStack)}
                className="text-xs text-back hover:text-back/80"
              >
                Copy
              </button>
            </div>
            <pre className="max-h-40 overflow-auto rounded bg-black/30 p-3 text-sm text-slate-300">
              {errorMessage}
              {componentStack && (
                <>
                  {"\n\nComponent Stack:"}
                  {componentStack}
                </>
              )}
            </pre>
          </div>

          <div className="flex gap-4">
            <button
              onClick={this.handleReset}
              className="rounded-lg bg-back px-6 py-3 font-medium hover:bg-back/80"
            >
              Try Again
            </button>
            <button
              onClick={this.handleReload}
              className="rounded-lg border border-line bg-panel px-6 py-3 font-medium hover:bg-line"
            >
              Reload Page
            </button>
            <button
              onClick={() => (window.location.href = "/")}
              className="rounded-lg border border-line bg-panel px-6 py-3 font-medium hover:bg-line"
            >
              Go Home
            </button>
          </div>

          <div className="mt-8 text-center text-xs text-slate-500">
            <p>
              If the problem persists, please contact support with the error details above.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Higher-order component for error boundaries
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, "children">
) {
  return function WithErrorBoundary(props: P) {
    return (
      <ErrorBoundary {...errorBoundaryProps}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}

// Hook for error handling in functional components
export function useErrorHandler() {
  const handleError = (error: Error, context?: string) => {
    console.error(`Error in ${context || "unknown context"}:`, error);
    
    // In a real app, you would send this to an error tracking service
    // Sentry.captureException(error, { extra: { context } });
    
    // Show user-friendly error message
    // toast.error(getErrorMessage(error));
  };

  return { handleError };
}
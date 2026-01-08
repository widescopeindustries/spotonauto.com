
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4 text-center">
          <h1 className="text-3xl font-bold text-red-500 mb-4">Something went wrong</h1>
          <p className="text-gray-400 mb-6">The application encountered an unexpected error.</p>
          <pre className="bg-gray-900 p-4 rounded text-left overflow-auto max-w-full text-xs text-red-300 mb-6">
            {this.state.error?.toString()}
          </pre>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-brand-cyan text-black font-bold rounded hover:bg-opacity-80 transition"
          >
            Reload Application
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

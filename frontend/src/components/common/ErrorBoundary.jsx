import { Component } from "react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // Log to console in dev — swap for Sentry/LogRocket in prod
    console.error("[ErrorBoundary]", error, info?.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-10 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">⚠️</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 mb-2">Something went wrong</h1>
          <p className="text-slate-500 text-sm mb-6">
            An unexpected error occurred. Please refresh the page.
          </p>
          {import.meta.env.DEV && this.state.error && (
            <pre className="text-left text-xs bg-slate-50 border border-slate-200 rounded-xl p-4 text-red-600 overflow-auto max-h-40 mb-5">
              {this.state.error.toString()}
            </pre>
          )}
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition text-sm">
            Reload Page
          </button>
        </div>
      </div>
    );
  }
}

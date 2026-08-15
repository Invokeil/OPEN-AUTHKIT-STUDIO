import { AlertTriangle, RotateCcw } from "lucide-react";
import { Component, type ReactNode } from "react";
import { appConfig } from "@/config";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="not-found-page" role="alert">
          <div className="not-found-card">
            <AlertTriangle size={38} aria-hidden="true" />
            <p className="eyebrow">{appConfig.brandName}</p>
            <h1>Something went wrong</h1>
            <p className="auth-copy">
              The page could not be rendered. Reload the demo and try again.
            </p>
            <button
              className="primary-button"
              type="button"
              onClick={() => window.location.reload()}
            >
              <RotateCcw size={16} aria-hidden="true" />
              Reload page
            </button>
          </div>
        </main>
      );
    }

    return this.props.children;
  }
}

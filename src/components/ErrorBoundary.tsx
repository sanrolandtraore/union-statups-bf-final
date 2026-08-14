import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { reportError } from "@/lib/monitoring";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Envoie l'erreur au service de monitoring (voir src/lib/monitoring.ts).
    // N'affecte jamais le rendu : reportError est volontairement infaillible.
    reportError(error, { componentStack: info.componentStack });
  }

  handleReload = () => {
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-7 w-7 text-destructive" />
          </div>
          <h1 className="font-display text-xl font-bold text-foreground">
            Une erreur inattendue est survenue
          </h1>
          <p className="max-w-sm text-sm text-muted-foreground">
            L'équipe a été notifiée automatiquement. Vous pouvez retourner à l'accueil et réessayer.
          </p>
          <button
            onClick={this.handleReload}
            className="mt-2 rounded-lg bg-gradient-gold px-5 py-2.5 text-sm font-semibold text-primary-foreground"
          >
            Retour à l'accueil
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;

import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props { children: ReactNode; }
interface State { error: Error | null; }

export class RouteErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("No se pudo cargar la pantalla", error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <main className="grid min-h-[50vh] place-items-center bg-[#F8FAFC] p-6" role="alert">
        <div className="w-full max-w-lg rounded-xl border border-red-200 bg-white p-6 text-center shadow-sm">
          <AlertTriangle className="mx-auto text-[#E9683B]" size={34} aria-hidden="true" />
          <h1 className="mt-4 text-lg font-extrabold text-gray-900">No pudimos cargar esta pantalla</h1>
          <p className="mt-2 text-sm leading-6 text-gray-600">
            La conexión pudo interrumpirse o existe una versión más reciente de la aplicación. Recarga para continuar sin perder datos ya guardados.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-5 inline-flex items-center gap-2 rounded-md bg-[#5454E9] px-4 py-2.5 text-sm font-bold text-white"
          >
            <RefreshCw size={15} aria-hidden="true" /> Recargar aplicación
          </button>
        </div>
      </main>
    );
  }
}

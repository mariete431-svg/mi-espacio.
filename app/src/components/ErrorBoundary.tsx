import { Component, type ReactNode } from "react";
import { Button } from "@/components/ui/button";

const RELOAD_KEY = "mi-recarga-por-version";

/** Tras publicar una versión nueva, las piezas antiguas de la web ya no existen. */
const isOldVersionError = (error: unknown) =>
  error instanceof Error && /dynamically imported module|Importing a module script failed|Failed to fetch|error loading dynamically/i.test(error.message);

/**
 * Si algo falla al dibujar una página, en vez de dejarla en blanco:
 * - si es porque hay una versión nueva de la web, recarga una vez sola;
 * - si no, muestra un aviso con un botón para recargar.
 */
export class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    if (!isOldVersionError(error)) return;
    let reloaded = false;
    try { reloaded = sessionStorage.getItem(RELOAD_KEY) === "1"; sessionStorage.setItem(RELOAD_KEY, "1"); } catch { /* sin guardado */ }
    if (!reloaded) window.location.reload();
  }

  componentDidMount() {
    // La página ha cargado bien: se permite otra recarga automática en el futuro
    window.setTimeout(() => { try { sessionStorage.removeItem(RELOAD_KEY); } catch { /* sin guardado */ } }, 5000);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return <main className="error-screen"><div>
      <span className="eyebrow">ALGO HA FALLADO</span>
      <h1>Vuelve a <em>intentarlo.</em></h1>
      <p>La página no se ha podido cargar. Puede que la web se acabe de actualizar o que la conexión haya fallado.</p>
      <Button variant="luxury" size="lg" onClick={() => window.location.reload()}>Recargar la página</Button>
    </div></main>;
  }
}

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Guardado en el navegador que nunca rompe la página: en modo privado o con los datos
 * bloqueados, localStorage puede fallar, y entonces simplemente no se guarda.
 */
export function readStored<T>(key: string, fallback: T, storage: "local" | "session" = "local"): T {
  try {
    const raw = (storage === "local" ? localStorage : sessionStorage).getItem(key);
    return raw === null ? fallback : JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writeStored(key: string, value: unknown, storage: "local" | "session" = "local") {
  try { (storage === "local" ? localStorage : sessionStorage).setItem(key, JSON.stringify(value)); } catch { /* sin guardado */ }
}

/** Identificador corto para listas (tareas, entradas del CV…). */
export const newId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

/** Pestañas accesibles: flechas, Inicio y Fin mueven entre pestañas (poner en el role="tablist"). */
export function onTabListKeyDown(event: { key: string; currentTarget: HTMLElement; preventDefault: () => void }) {
  const tabs = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('[role="tab"]'));
  const current = tabs.indexOf(document.activeElement as HTMLElement);
  if (current < 0) return;
  const next = event.key === "ArrowRight" ? (current + 1) % tabs.length
    : event.key === "ArrowLeft" ? (current - 1 + tabs.length) % tabs.length
      : event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1 : -1;
  if (next < 0) return;
  event.preventDefault();
  tabs[next]?.focus();
  tabs[next]?.click();
}
